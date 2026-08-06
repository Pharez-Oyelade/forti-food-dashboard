import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  lead_name: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
  },
  segment: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
    default: 'Nigeria',
  },
  lead_source: {
    type: String,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lead_stage: {
    type: String,
    enum: ['New', 'Contacted', 'Discovery', 'Qualified', 'Disqualified', 'Nurture'],
    default: 'New',
  },
  rough_deal_size: {
    type: Number,
    min: 0,
    default: 0,
  },
  
  // Gate Criteria
  decision_maker_identified: { type: Boolean, default: false },
  deal_size_known: { type: Boolean, default: false },
  use_case_understood: { type: Boolean, default: false },
  commercial_trajectory: { type: Boolean, default: false },

  // Calculated fields (populated by pre-save hook)
  qualification_score: { type: Number, min: 0, max: 4, default: 0 },
  is_ready_to_promote: { type: Boolean, default: false },
  status_last_changed: { type: Date, default: Date.now },
  is_promoted: { type: Boolean, default: false }, // If true, it was converted to a Deal
  deal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate metrics on save
leadSchema.pre('save', function (next) {
  // Update status_last_changed if stage changed
  if (this.isModified('lead_stage')) {
    this.status_last_changed = new Date();
  }

  // Calculate gate score
  let score = 0;
  if (this.decision_maker_identified) score += 1;
  if (this.deal_size_known) score += 1;
  if (this.use_case_understood) score += 1;
  if (this.commercial_trajectory) score += 1;
  
  this.qualification_score = score;
  this.is_ready_to_promote = (score === 4);

  next();
});

// Virtual for Days in Stage
leadSchema.virtual('days_in_stage').get(function () {
  if (!this.status_last_changed) return 0;
  return Math.floor((new Date() - this.status_last_changed) / (1000 * 60 * 60 * 24));
});

// Virtual for Stalled status
leadSchema.virtual('is_stalled').get(function () {
  return this.days_in_stage > 14 && !this.is_promoted && this.lead_stage !== 'Disqualified';
});

export const Lead = mongoose.model('Lead', leadSchema);
