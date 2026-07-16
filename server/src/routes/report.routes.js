import express from 'express';
import { Deal } from '../models/Deal.js';
import { Product } from '../models/Product.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { fieldFilter } from '../middleware/fieldFilter.js';
import { ACCESS_LEVELS, SECTIONS, INVENTORY_STATUS } from '../../../shared/constants.js';

const router = express.Router();

router.use(authenticate);

// Get Weekly Summary
router.get('/weekly-summary', async (req, res, next) => {
  try {
    const summary = {};

    // --- PIPELINE DATA ---
    // If user has at least VIEW access to pipeline
    if (req.user.role.permissions[SECTIONS.PIPELINE]?.access && req.user.role.permissions[SECTIONS.PIPELINE].access !== ACCESS_LEVELS.NONE) {
       const pipelineAccess = req.user.role.permissions[SECTIONS.PIPELINE].access;
       const filter = pipelineAccess === ACCESS_LEVELS.EDIT_OWN || pipelineAccess === ACCESS_LEVELS.VIEW_OWN ? { assigned_to: req.user._id } : {};
       
       const deals = await Deal.find(filter);
       let total_value = 0;
       let weighted_value = 0;
       
       deals.forEach(d => {
         total_value += d.value_naira || 0;
         weighted_value += (d.value_naira || 0) * ((d.probability_pct || 0) / 100);
       });

       summary.pipeline = {
         total_deals: deals.length,
         total_value: pipelineAccess === ACCESS_LEVELS.VIEW_RESTRICTED ? undefined : total_value,
         weighted_value: pipelineAccess === ACCESS_LEVELS.VIEW_RESTRICTED ? undefined : weighted_value,
       };
    }

    // --- INVENTORY DATA ---
    // If user has at least VIEW access to inventory
    if (req.user.role.permissions[SECTIONS.INVENTORY]?.access && req.user.role.permissions[SECTIONS.INVENTORY].access !== ACCESS_LEVELS.NONE) {
       const invAccess = req.user.role.permissions[SECTIONS.INVENTORY].access;
       
       const products = await Product.find({});
       let total_skus = products.length;
       let total_stock_value = 0;
       let depleted_count = 0;
       let expiry_risks = 0;
       
       products.forEach(p => {
         total_stock_value += (p.units_on_hand * p.unit_cost) || 0;
         if (p.status === INVENTORY_STATUS.DEPLETED || p.units_on_hand === 0) {
           depleted_count++;
         }
         if (p.status === INVENTORY_STATUS.EXPIRY_RISK) {
           expiry_risks++;
         }
       });

       summary.inventory = {
         total_skus,
         depleted_count,
         expiry_risks,
         total_stock_value: invAccess === ACCESS_LEVELS.VIEW_RESTRICTED ? undefined : total_stock_value,
       };
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

export default router;
