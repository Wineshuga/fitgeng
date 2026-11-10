import { Schema, model, type InferSchemaType } from 'mongoose';
import { SPORT_FORMATS } from '@fitgeng/shared';

/**
 * Sports catalogue (reference data). Platform admins add and edit sports
 * (Phase 2); the defaults are seeded. Inactive sports are hidden from public
 * listings, but records that reference them keep working.
 */
const sportSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 600 },
    format: { type: String, enum: SPORT_FORMATS, required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 100 },
  },
  { timestamps: true },
);

// Public listing: active sports in display order.
sportSchema.index({ isActive: 1, sortOrder: 1, name: 1 });

export type SportDoc = InferSchemaType<typeof sportSchema> & { _id: unknown; createdAt: Date; updatedAt: Date };

export const Sport = model('Sport', sportSchema);
