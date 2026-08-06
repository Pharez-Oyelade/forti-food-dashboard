import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donor_name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      enum: ['USD', 'NGN', 'GBP', 'EUR'],
      default: 'NGN',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Donation = mongoose.model('Donation', donationSchema);
