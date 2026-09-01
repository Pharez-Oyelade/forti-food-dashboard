import mongoose from 'mongoose';
import { CONTACT_STAGES, CUSTOMER_SOURCES } from '../../../shared/constants.js';

const contactSchema = new mongoose.Schema(
  {
    company_name: {
      type: String,
      required: true,
      trim: true,
    },
    contact_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    customer_source: {
      type: String,
      enum: Object.values(CUSTOMER_SOURCES),
      default: CUSTOMER_SOURCES.OUTBOUND,
    },
    contact_stage: {
      type: String,
      enum: Object.values(CONTACT_STAGES),
      default: CONTACT_STAGES.NEW,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    is_converted_to_lead: {
      type: Boolean,
      default: false,
    },
    converted_lead_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
  },
  { timestamps: true }
);

// Indexes for faster querying, especially for filtering out converted contacts
contactSchema.index({ owner: 1, is_converted_to_lead: 1 });
contactSchema.index({ company_name: 1 });

export const Contact = mongoose.model('Contact', contactSchema);
