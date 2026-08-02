import express from 'express';
import { WeeklySnapshot } from '../models/WeeklySnapshot.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { fieldFilter } from '../middleware/fieldFilter.js';
import { ACCESS_LEVELS, SECTIONS, INVENTORY_STATUS } from '../../../shared/constants.js';

const router = express.Router();

router.use(authenticate);

// Get Weekly Summary
router.get('/weekly-summary', async (req, res, next) => {
  try {
    // Fetch the latest snapshot
    const latestSnapshot = await WeeklySnapshot.findOne().sort({ createdAt: -1 });

    if (!latestSnapshot) {
      return res.json({ success: true, data: null });
    }

    const summary = {
      week_ending: latestSnapshot.week_ending,
      createdAt: latestSnapshot.createdAt
    };

    // --- PIPELINE DATA ---
    if (req.user.role.permissions[SECTIONS.PIPELINE]?.access && req.user.role.permissions[SECTIONS.PIPELINE].access !== ACCESS_LEVELS.NONE) {
       const pipelineAccess = req.user.role.permissions[SECTIONS.PIPELINE].access;
       summary.pipeline = {
         total_deals: latestSnapshot.pipeline.total_deals,
         total_value: pipelineAccess === ACCESS_LEVELS.VIEW_RESTRICTED ? undefined : latestSnapshot.pipeline.total_value,
         weighted_value: pipelineAccess === ACCESS_LEVELS.VIEW_RESTRICTED ? undefined : latestSnapshot.pipeline.weighted_value,
       };
    }

    // --- INVENTORY DATA ---
    if (req.user.role.permissions[SECTIONS.INVENTORY]?.access && req.user.role.permissions[SECTIONS.INVENTORY].access !== ACCESS_LEVELS.NONE) {
       const invAccess = req.user.role.permissions[SECTIONS.INVENTORY].access;
       summary.inventory = {
         total_skus: latestSnapshot.inventory.total_skus,
         depleted_count: latestSnapshot.inventory.depleted_count,
         expiry_risks: latestSnapshot.inventory.expiry_risks,
         total_stock_value: invAccess === ACCESS_LEVELS.VIEW_RESTRICTED ? undefined : latestSnapshot.inventory.total_stock_value,
       };
    }

    // --- PROGRAMS DATA ---
    if (req.user.role.permissions[SECTIONS.MEALMATE]?.access && req.user.role.permissions[SECTIONS.MEALMATE].access !== ACCESS_LEVELS.NONE) {
       summary.programs = latestSnapshot.programs;
    }

    // --- SOCIAL DATA ---
    if (req.user.role.permissions[SECTIONS.SOCIAL]?.access && req.user.role.permissions[SECTIONS.SOCIAL].access !== ACCESS_LEVELS.NONE) {
       summary.social = latestSnapshot.social;
    }

    // --- BUSINESS GAPS DATA ---
    if (req.user.role.permissions[SECTIONS.BUSINESS_GAPS]?.access && req.user.role.permissions[SECTIONS.BUSINESS_GAPS].access !== ACCESS_LEVELS.NONE) {
       summary.gaps = latestSnapshot.gaps;
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
