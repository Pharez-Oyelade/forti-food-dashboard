import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    type: {
      type: String,
      enum: ['SALE', 'DEMO', 'MARKETING', 'REGULATORY', 'RETURN'],
      required: true,
    },
    person: { type: String },
    batch_number: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
