// Runs before every test file, before any app module is imported.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://placeholder/test'; // replaced by the memory server
process.env.REDIS_URL = '';
process.env.APP_URL = 'http://localhost:5173';
