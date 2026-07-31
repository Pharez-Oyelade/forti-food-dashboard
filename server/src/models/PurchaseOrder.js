import mongoose from 'mongoose';
import { INVENTORY_STATUS } from '../../../shared/constants.js';

const purchaseOrderSchema = new mongoose.Schema(
  {
    po_number: { type: String, required: true, unique: true },
    vendor_name: { type: String, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity_ordered: { type: Number, required: true },
    quantity_received: { type: Number, default: 0 },
    expected_delivery_date: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'RECEIVED', 'CANCELLED'],
      default: 'PENDING',
    },
    total_cost: { type: Number },
    notes: { type: String },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
