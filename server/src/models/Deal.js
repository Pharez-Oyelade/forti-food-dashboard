import mongoose from 'mongoose';
import { DEAL_STAGES, RAG_STATUS, FORECAST_CATEGORIES } from '../../../shared/constants.js';

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
    segment: { type: String },
    value_naira: { type: Number, default: 0 },
    probability_pct: { type: Number, default: 0, min: 0, max: 100 },
    expected_close_date: { type: Date },
    contract_term_months: { type: Number },
    forecast_category: {
      type: String,
      enum: Object.values(FORECAST_CATEGORIES),
      default: FORECAST_CATEGORIES.PIPELINE,
    },
    last_activity_date: { type: Date, default: Date.now },
    next_follow_up: { type: Date },
    stage_entered_date: { type: Date, default: Date.now },
    rag_status: {
      type: String,
      enum: Object.values(RAG_STATUS),
      default: RAG_STATUS.AMBER,
    },
    risk_reason: { type: String },
    lost_reason: { type: String },
    notes: { type: String },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: { type: String },
    vendor_compliance: {
      pencom: { type: Boolean, default: false },
      tax_clearance: { type: Boolean, default: false },
      cac: { type: Boolean, default: false },
    },
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
