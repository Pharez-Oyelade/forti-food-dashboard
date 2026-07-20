import { z } from 'zod';
import { INVENTORY_STATUS } from '../../../shared/constants.js';

export const createProductSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  unit_cost: z.number().min(0).optional(),
  landed_cost_per_unit: z.number().min(0).optional(),
  unit_price: z.number().min(0).optional(),
  units_received: z.number().min(0).optional(),
  units_on_hand: z.number().min(0).optional(),
  units_sold_to_date: z.number().min(0).optional(),
  shelf_life_months: z.number().min(0).optional(),
  status: z.enum(Object.values(INVENTORY_STATUS)).optional(),
  expiry_date: z.string().datetime().optional().nullable(),
  batch_number: z.string().optional(),
  category: z.string().optional(),
  reorder_point: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();
