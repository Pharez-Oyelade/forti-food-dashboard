import mongoose from 'mongoose';

const snapshotSchema = new mongoose.Schema({
  week_ending: { type: Date, required: true },
  pipeline: {
    total_deals: { type: Number, default: 0 },
    total_value: { type: Number, default: 0 },
    weighted_value: { type: Number, default: 0 },
  },
  inventory: {
    total_skus: { type: Number, default: 0 },
    total_stock_value: { type: Number, default: 0 },
    depleted_count: { type: Number, default: 0 },
    expiry_risks: { type: Number, default: 0 },
  },
  programs: {
    meals_delivered: { type: Number, default: 0 },
    active_schools: { type: Number, default: 0 },
  },
  social: {
    engagement_rate: { type: Number, default: 0 },
    engagement_delta: { type: Number, default: 0 },
  },
  gaps: {
    open_count: { type: Number, default: 0 },
  }
}, { timestamps: true });

export const WeeklySnapshot = mongoose.model('WeeklySnapshot', snapshotSchema);
