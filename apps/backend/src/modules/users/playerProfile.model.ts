import { Schema, Types, model } from 'mongoose';

/**
 * Player-facing profile (1:1 with User), created at registration. The editing
 * API arrives in Phase 2c; sports and location power Discover in Phase 4.
 */
const playerProfileSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, trim: true, maxlength: 500 },
    location: {
      state: { type: String, trim: true },
      city: { type: String, trim: true },
      area: { type: String, trim: true },
    },
    sports: [
      {
        _id: false,
        sportId: { type: Types.ObjectId, ref: 'Sport', required: true },
        skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'pro'], required: true },
        yearsExperience: { type: Number, min: 0, max: 80 },
      },
    ],
    visibility: { type: String, enum: ['public', 'members'], default: 'members' },
  },
  { timestamps: true },
);

export const PlayerProfile = model('PlayerProfile', playerProfileSchema);
