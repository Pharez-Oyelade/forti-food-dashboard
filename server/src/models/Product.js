import mongoose from 'mongoose';
import { INVENTORY_STATUS } from '../../../shared/constants.js';

const productSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    unit_cost: { type: Number, default: 0 },
    landed_cost_per_unit: { type: Number, default: 0 },
    unit_price: { type: Number, default: 0 },
    units_received: { type: Number, default: 0 },
    units_on_hand: { type: Number, default: 0 },
    units_sold_to_date: { type: Number, default: 0 },
    shelf_life_months: { type: Number, default: 12 },
    status: {
      type: String,
      enum: Object.values(INVENTORY_STATUS),
      default: INVENTORY_STATUS.OK,
    },
    expiry_date: { type: Date },
    batch_number: { type: String },
    category: { type: String },
    reorder_point: { type: Number, default: 100 },
    notes: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
productSchema.virtual('stock_value_at_cost').get(function () {
  return (this.units_on_hand || 0) * (this.landed_cost_per_unit || this.unit_cost || 0);
});

productSchema.virtual('sell_through_rate').get(function () {
  const totalReceived = this.units_received || ((this.units_on_hand || 0) + (this.units_sold_to_date || 0));
  if (totalReceived === 0) return 0;
  return ((this.units_sold_to_date || 0) / totalReceived) * 100;
});

// Pre-save hook to compute status if not explicitly set
productSchema.pre('save', function (next) {
  if (this.isModified('units_on_hand') || this.isModified('expiry_date') || this.isModified('units_received') || this.isModified('units_sold_to_date')) {
    
    let isExpiryRisk = false;
    if (this.expiry_date) {
      const daysToExpiry = (this.expiry_date - new Date()) / (1000 * 60 * 60 * 24);
      if (daysToExpiry > 0 && daysToExpiry < 90) { // Increased to 90 days for better visibility of risk
        isExpiryRisk = true;
      }
    }

    if (this.units_on_hand === 0) {
      this.status = INVENTORY_STATUS.DEPLETED;
    } else if (isExpiryRisk) {
      this.status = INVENTORY_STATUS.EXPIRY_RISK;
    } else if (this.sell_through_rate < 10 && this.units_on_hand > 0) {
      this.status = INVENTORY_STATUS.SLOW_MOVER;
    } else {
      this.status = INVENTORY_STATUS.OK;
    }
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);
