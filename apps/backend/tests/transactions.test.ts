import mongoose from 'mongoose';
import { startTestDb, stopTestDb } from './helpers/db';

/**
 * Checks architecture D10: multi-document transactions work on the replica set,
 * and a failure inside one rolls back every write.
 */
describe('MongoDB transactions', () => {
  const Account = mongoose.model('TxAccount', new mongoose.Schema({ name: String, balance: Number }));

  beforeAll(async () => {
    await startTestDb();
    await Account.createCollection();
  });
  afterAll(stopTestDb);

  it('rolls back all writes when the transaction fails', async () => {
    await Account.create({ name: 'a', balance: 100 });

    await expect(
      mongoose.connection.transaction(async (session) => {
        await Account.updateOne({ name: 'a' }, { $inc: { balance: -50 } }, { session });
        await Account.create([{ name: 'b', balance: 50 }], { session });
        throw new Error('fail after writes');
      }),
    ).rejects.toThrow('fail after writes');

    const a = await Account.findOne({ name: 'a' }).lean();
    expect(a?.balance).toBe(100);
    expect(await Account.countDocuments({ name: 'b' })).toBe(0);
  });
});
