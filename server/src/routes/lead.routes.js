import express from 'express';
import { Lead } from '../models/Lead.js';
import { Deal } from '../models/Deal.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ownerFilter } from '../middleware/ownerFilter.js';
import { fieldFilter } from '../middleware/fieldFilter.js';
import { ACCESS_LEVELS, SECTIONS, DEAL_STAGES, RAG_STATUS } from '../../../shared/constants.js';

const router = express.Router();

// All routes require authentication and basic pipeline access
router.use(authenticate);
router.use(authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.VIEW));

// Get summary (must be before /:id)
router.get('/summary', fieldFilter(SECTIONS.PIPELINE), ownerFilter, async (req, res, next) => {
  try {
    const filter = req.rbacFilter || {};
    filter.is_promoted = false; // Only summarize active leads
    
    const summary = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_leads: { $sum: 1 },
          ready_to_promote: { $sum: { $cond: ['$is_ready_to_promote', 1, 0] } }
        }
      }
    ]);
    
    const stageCounts = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: '$lead_stage', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: summary[0] || { total_leads: 0, ready_to_promote: 0 },
        stage_counts: stageCounts
      }
    });
  } catch (error) {
    next(error);
  }
});

// List Leads
router.get('/', fieldFilter(SECTIONS.PIPELINE), ownerFilter, async (req, res, next) => {
  try {
    const filter = req.rbacFilter || {};
    filter.is_promoted = false;
    const leads = await Lead.find(filter).populate('owner', 'name').sort('-createdAt');
    res.json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
});

// Get Lead
router.get('/:id', fieldFilter(SECTIONS.PIPELINE), ownerFilter, async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...(req.rbacFilter || {}) };
    const lead = await Lead.findOne(filter).populate('owner', 'name');
    
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }
    
    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
});

// Create Lead
router.post(
  '/',
  authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT),
  async (req, res, next) => {
    try {
      const data = { ...req.body };
      
      // If user is edit_own or didn't provide an owner, default to self
      if (req.accessLevel === ACCESS_LEVELS.EDIT_OWN || !data.owner) {
        data.owner = req.user._id;
      }
      
      const lead = await Lead.create(data);
      res.status(201).json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  }
);

// Update Lead
router.put(
  '/:id',
  authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT),
  ownerFilter, // ensures req.rbacFilter is set for EDIT_OWN
  async (req, res, next) => {
    try {
      const filter = { _id: req.params.id, ...(req.rbacFilter || {}) };
      const lead = await Lead.findOne(filter);
      
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
      }
      
      Object.assign(lead, req.body);
      await lead.save();
      
      res.json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  }
);

// Convert Lead to Deal
router.post(
  '/:id/convert',
  authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT),
  ownerFilter,
  async (req, res, next) => {
    try {
      const filter = { _id: req.params.id, ...(req.rbacFilter || {}) };
      const lead = await Lead.findOne(filter);
      
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      if (lead.is_promoted) {
        return res.status(400).json({ success: false, message: 'Lead already converted' });
      }
      if (!lead.is_ready_to_promote) {
        return res.status(400).json({ success: false, message: 'Lead does not meet all 4 gate criteria for promotion' });
      }

      // Create new Deal
      const deal = await Deal.create({
        deal_name: lead.lead_name,
        company: lead.company,
        deal_stage: DEAL_STAGES.PROSPECTING,
        value_naira: lead.rough_deal_size || 0,
        probability_pct: 20, // default starting probability
        assigned_to: lead.owner,
        rag_status: RAG_STATUS.AMBER
      });

      // Mark Lead as promoted
      lead.is_promoted = true;
      lead.deal_id = deal._id;
      lead.lead_stage = 'Qualified';
      await lead.save();
      
      res.json({ success: true, data: { lead, deal } });
    } catch (error) {
      next(error);
    }
  }
);

// Delete Lead
router.delete('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
