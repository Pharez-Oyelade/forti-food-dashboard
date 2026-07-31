import mongoose from 'mongoose';

const instagramMetricSchema = new mongoose.Schema({
  week_ending: {
    type: Date,
    required: true,
  },
  total_followers: {
    type: Number,
    required: true,
    min: 0,
  },
  new_followers: {
    type: Number,
    default: 0,
  },
  weekly_reach: {
    type: Number,
    default: 0,
    min: 0,
  },
  impressions: {
    type: Number,
    default: 0,
    min: 0,
  },
  engagement_rate: {
    type: Number,
    default: 0,
    min: 0,
  },
  posts_published: {
    type: Number,
    default: 0,
    min: 0,
  },
  stories_published: {
    type: Number,
    default: 0,
    min: 0,
  },
  total_likes: {
    type: Number,
    default: 0,
    min: 0,
  },
  total_comments: {
    type: Number,
    default: 0,
    min: 0,
  },
  top_post_caption: {
    type: String,
    trim: true,
  },
  top_post_likes: {
    type: Number,
    default: 0,
    min: 0,
  }
}, {
  timestamps: true
});

// Ensure week_ending is unique so we don't have duplicate metrics for the same week
instagramMetricSchema.index({ week_ending: 1 }, { unique: true });

export const InstagramMetric = mongoose.model('InstagramMetric', instagramMetricSchema);
