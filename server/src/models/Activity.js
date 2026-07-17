import mongoose from 'mongoose';
import { ACTIVITY_TYPES, ACTIVITY_OUTCOMES } from '../../../shared/constants.js';

const activitySchema = new mongoose.Schema(
  {
    activity_type: {
      type: String,
      enum: Object.values(ACTIVITY_TYPES),
      required: true,
    },
    subject: { type: String, required: true },
    notes: { type: String },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    grant: { type: mongoose.Schema.Types.ObjectId, ref: 'Grant' },
    contact_name: { type: String },
    contact_company: { type: String },
    outcome: {
      type: String,
      enum: Object.values(ACTIVITY_OUTCOMES),
      default: ACTIVITY_OUTCOMES.PENDING,
    },
    follow_up_date: { type: Date },
    logged_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activity_date: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Activity = mongoose.model('Activity', activitySchema);
