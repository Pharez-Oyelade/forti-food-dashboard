import express from 'express';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.VIEW));

// List Purchase Orders
router.get('/', async (req, res, next) => {
  try {
    const pos = await PurchaseOrder.find().populate('product', 'product_name sku unit_cost').sort('-createdAt');
    res.json({ success: true, data: pos });
  } catch (error) {
    next(error);
  }
});

// Create Purchase Order
router.post('/', authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.EDIT), async (req, res, next) => {
  try {
    const po = await PurchaseOrder.create({ ...req.body, created_by: req.user._id });
    const populated = await PurchaseOrder.findById(po._id).populate('product', 'product_name sku unit_cost');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
});

// Update Purchase Order
router.put('/:id', authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.EDIT), async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('product', 'product_name sku unit_cost');
    if (!po) {
      return res.status(404).json({ success: false, message: 'PO not found' });
    }
    res.json({ success: true, data: po });
  } catch (error) {
    next(error);
  }
});

export default router;
