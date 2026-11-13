import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { CAPABILITIES, type AuthUserDto } from '@fitgeng/shared';

/**
 * A person with a login. Capabilities combine freely (architecture §3).
 * `passwordHash` is never selected unless explicitly requested.
 * `tokenVersion` increments on password reset or forced sign-out, which
 * invalidates every access token issued before.
 */
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    phone: { type: String, trim: true, maxlength: 20 },
    capabilities: { type: [{ type: String, enum: CAPABILITIES }], default: ['player'] },
    isPlatformAdmin: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type UserFields = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserFields>;

export const User = model('User', userSchema);

export function toAuthUserDto(user: Pick<UserDoc, '_id' | 'firstName' | 'lastName' | 'email' | 'capabilities' | 'isPlatformAdmin' | 'emailVerifiedAt'>): AuthUserDto {
  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    capabilities: [...user.capabilities] as AuthUserDto['capabilities'],
    isPlatformAdmin: user.isPlatformAdmin,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}
