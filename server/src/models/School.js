import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema(
  {
    school_name: { type: String, required: true },
    location: { type: String },
    pupil_count: { type: Number, default: 0 },
    vulnerability_data: { type: String },
    leadership_contacts: { type: String },
    need_score: { type: Number, default: 0, min: 0, max: 70 },
    readiness_score: { type: Number, default: 0, min: 0, max: 30 },
    priority_score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Identified', 'Vetted', 'Supported'],
      default: 'Identified',
    },
    onboarding_date: { type: Date },
    meals_delivered: { type: Number, default: 0 },
    cost_per_meal: { type: Number, default: 0 },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to compute priority_score
schoolSchema.pre('save', function (next) {
  this.priority_score = (this.need_score || 0) + (this.readiness_score || 0);
  next();
});

export const School = mongoose.model('School', schoolSchema);
