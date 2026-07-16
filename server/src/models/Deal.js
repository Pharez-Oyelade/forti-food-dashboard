import mongoose from 'mongoose';
import { DEAL_STAGES, RAG_STATUS } from '../../../shared/constants.js';

const dealSchema = new mongoose.Schema(
  {
    deal_name: { type: String, required: true },
    company: { type: String, required: true },
    contact_person: { type: String },
    contact_email: { type: String },
    contact_phone: { type: String },
    deal_stage: {
      type: String,
      enum: Object.values(DEAL_STAGES),
      default: DEAL_STAGES.PROSPECTING,
    },
    value_naira: { type: Number, default: 0 },
    probability_pct: { type: Number, default: 0, min: 0, max: 100 },
    expected_close_date: { type: Date },
    last_activity_date: { type: Date, default: Date.now },
    next_follow_up: { type: Date },
    rag_status: {
      type: String,
      enum: Object.values(RAG_STATUS),
      default: RAG_STATUS.AMBER,
    },
    notes: { type: String },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
dealSchema.virtual('weighted_value').get(function () {
  return (this.value_naira || 0) * ((this.probability_pct || 0) / 100);
});

dealSchema.virtual('days_in_stage').get(function () {
  // Simplification: just tracking days since last update for now. 
  // A true 'days_in_stage' would require a history log of stage changes.
  const diffTime = Math.abs(new Date() - this.updatedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

export const Deal = mongoose.model('Deal', dealSchema);
