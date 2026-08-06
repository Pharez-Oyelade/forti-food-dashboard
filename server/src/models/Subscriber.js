import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    channel: {
      type: String, // e.g., 'Paystack', 'Stripe'
      default: 'Paystack',
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
    status: {
      type: String,
      enum: ['Active', 'At-Risk', 'Churned'],
      default: 'Active',
    },
    txn_count: {
      type: Number,
      default: 1,
    },
    first_payment_date: {
      type: Date,
    },
    last_payment_date: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);
