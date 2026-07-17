import express from 'express';
import { Product } from '../models/Product.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { fieldFilter } from '../middleware/fieldFilter.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validators.js';
import { ACCESS_LEVELS, SECTIONS, INVENTORY_STATUS } from '../../../shared/constants.js';

const router = express.Router();

// All routes require authentication and basic inventory access
router.use(authenticate);
router.use(authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.VIEW));

// Get summary
router.get('/summary', fieldFilter(SECTIONS.INVENTORY), async (req, res, next) => {
  try {
    const products = await Product.find({});
    
    let total_skus = 0;
    let total_stock_value = 0;
    let depleted_count = 0;
    let expiry_risks = 0;
    
    products.forEach(p => {
      total_skus++;
      total_stock_value += (p.units_on_hand * p.unit_cost) || 0;
      if (p.status === INVENTORY_STATUS.DEPLETED || p.units_on_hand === 0) {
        depleted_count++;
      }
      if (p.status === INVENTORY_STATUS.EXPIRY_RISK) {
        expiry_risks++;
      }
    });

    res.json({
      success: true,
      data: {
        total_skus,
        total_stock_value,
        depleted_count,
        expiry_risks
      }
    });
  } catch (error) {
    next(error);
  }
});

// List Products
router.get('/', fieldFilter(SECTIONS.INVENTORY), async (req, res, next) => {
  try {
    const products = await Product.find({}).sort('-createdAt');
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// Get Product
router.get('/:id', fieldFilter(SECTIONS.INVENTORY), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// Create Product
router.post(
  '/',
  authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.EDIT),
  validate(createProductSchema),
  async (req, res, next) => {
    try {
      const product = await Product.create(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
);

// Update Product
router.put(
  '/:id',
  authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.EDIT),
  validate(updateProductSchema),
  async (req, res, next) => {
    try {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
);

// Delete Product
router.delete('/:id', authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.FULL), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
