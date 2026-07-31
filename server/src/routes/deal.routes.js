import express from 'express';
import { Deal } from '../models/Deal.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { ownerFilter } from '../middleware/ownerFilter.js';
import { fieldFilter } from '../middleware/fieldFilter.js';
import { createDealSchema, updateDealSchema } from '../validators/deal.validators.js';
import { ACCESS_LEVELS, SECTIONS, DEAL_STAGES, RAG_STATUS } from '../../../shared/constants.js';

const router = express.Router();

// All routes require authentication and basic pipeline access
router.use(authenticate);
router.use(authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.VIEW));

// Get summary (must be before /:id)
router.get('/summary', fieldFilter(SECTIONS.PIPELINE), ownerFilter, async (req, res, next) => {
  try {
    const filter = req.rbacFilter || {};
    
    const summary = await Deal.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_deals: { $sum: 1 },
          total_value: { $sum: '$value_naira' },
          weighted_value: { 
            $sum: { $multiply: ['$value_naira', { $divide: ['$probability_pct', 100] }] }
          }
        }
      }
    ]);
    
    const stageCounts = await Deal.aggregate([
      { $match: filter },
      { $group: { _id: '$deal_stage', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: summary[0] || { total_deals: 0, total_value: 0, weighted_value: 0 },
        stage_counts: stageCounts
      }
    });
  } catch (error) {
    next(error);
  }
});

// List Deals
router.get('/', fieldFilter(SECTIONS.PIPELINE), ownerFilter, async (req, res, next) => {
  try {
    const filter = req.rbacFilter || {};
    const deals = await Deal.find(filter).populate('assigned_to', 'name').sort('-createdAt');
    res.json({ success: true, data: deals });
  } catch (error) {
    next(error);
  }
});

// Get Deal
router.get('/:id', fieldFilter(SECTIONS.PIPELINE), ownerFilter, async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...(req.rbacFilter || {}) };
    const deal = await Deal.findOne(filter).populate('assigned_to', 'name');
    
    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found or access denied' });
    }
    
    res.json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
});

// Create Deal
router.post(
  '/',
  authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT),
  validate(createDealSchema),
  async (req, res, next) => {
    try {
      const data = { ...req.body };
      
      // If user is edit_own, force assignment to self
      if (req.accessLevel === ACCESS_LEVELS.EDIT_OWN) {
        data.assigned_to = req.user._id;
      } else if (!data.assigned_to) {
        // Default to creator if not specified
        data.assigned_to = req.user._id;
      }
      
      const deal = await Deal.create(data);
      res.status(201).json({ success: true, data: deal });
    } catch (error) {
      next(error);
    }
  }
);

// Update Deal
router.put(
  '/:id',
  authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT),
  validate(updateDealSchema),
  ownerFilter, // ensures req.rbacFilter is set for EDIT_OWN
  async (req, res, next) => {
    try {
      const filter = { _id: req.params.id, ...(req.rbacFilter || {}) };
      
      // Fetch the existing deal first to check current segment if not provided in payload
      const existingDeal = await Deal.findOne(filter);
      if (!existingDeal) {
        return res.status(404).json({ success: false, message: 'Deal not found or access denied' });
      }

      // Check Vendor Compliance Gates for Government Deals
      const segment = req.body.segment || existingDeal.segment;
      if (segment && segment.toLowerCase() === 'government') {
        const targetStage = req.body.deal_stage || existingDeal.deal_stage;
        
        // Stages that require full vendor compliance
        const restrictedStages = [DEAL_STAGES.PROPOSAL, DEAL_STAGES.NEGOTIATION, DEAL_STAGES.CLOSED_WON];
        
        if (restrictedStages.includes(targetStage)) {
          const compliance = {
            ...(existingDeal.vendor_compliance ? existingDeal.vendor_compliance.toObject() : {}),
            ...(req.body.vendor_compliance || {})
          };
          
          if (!compliance.pencom || !compliance.tax_clearance || !compliance.cac) {
            return res.status(400).json({ 
              success: false, 
              message: 'Government deals cannot progress to Proposal, Negotiation, or Closed Won without full vendor compliance (PENCOM, Tax Clearance, CAC).' 
            });
          }
        }
      }

      const deal = await Deal.findOneAndUpdate(filter, req.body, { new: true });
      
      res.json({ success: true, data: deal });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk Close Stalled Deals
router.post('/bulk-close-stalled', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Deal.updateMany(
      {
        deal_stage: { $nin: [DEAL_STAGES.CLOSED_WON, DEAL_STAGES.CLOSED_LOST] },
        $or: [
          { last_activity_date: { $lt: thirtyDaysAgo } },
          { rag_status: RAG_STATUS.RED }
        ]
      },
      {
        $set: {
          deal_stage: DEAL_STAGES.CLOSED_LOST,
          lost_reason: 'Strategic Cleanup - Stalled Deal',
          rag_status: RAG_STATUS.RED
        }
      }
    );

    res.json({ success: true, message: `Successfully closed ${result.modifiedCount} stalled deals.` });
  } catch (error) {
    next(error);
  }
});

// Delete Deal
router.delete('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), async (req, res, next) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
