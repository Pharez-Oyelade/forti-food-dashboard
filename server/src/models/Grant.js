import mongoose from 'mongoose';
import { GRANT_TYPES, GRANT_STATUSES } from '../../../shared/constants.js';

const grantSchema = new mongoose.Schema(
  {
    program_name: { type: String, required: true },
    funder_organisation: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(GRANT_TYPES),
    },
    focus_area: { type: String },
    status: {
      type: String,
      enum: Object.values(GRANT_STATUSES),
      default: GRANT_STATUSES.RESEARCHING,
    },
    award_amount: { type: Number, default: 0 },
    currency: {
      type: String,
      enum: ['USD', 'NGN', 'GBP', 'EUR'],
      default: 'USD',
    },
    application_deadline: { type: Date },
    is_rolling: { type: Boolean, default: false },
    decision_date: { type: Date },
    eligibility_notes: { type: String },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Grant = mongoose.model('Grant', grantSchema);
