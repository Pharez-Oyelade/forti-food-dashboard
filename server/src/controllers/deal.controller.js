import { Deal } from '../models/Deal.js';
import { DEAL_STAGES, RAG_STATUS, ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';

export const getSummary = async (req, res, next) => {
  try {
    const filter = req.rbacFilter || {};
    const [summary, stageCounts] = await Promise.all([
      Deal.aggregate([
        { $match: { ...filter, deal_stage: { $nin: [DEAL_STAGES.CLOSED_WON, DEAL_STAGES.CLOSED_LOST, DEAL_STAGES.CANCELLED] } } },
        { $group: { _id: null, total_deals: { $sum: 1 }, total_value: { $sum: '$value_naira' }, weighted_value: { $sum: { $multiply: ['$value_naira', { $divide: ['$probability_pct', 100] }] } } } },
      ]),
      Deal.aggregate([
        { $match: filter },
        { $group: { _id: '$deal_stage', count: { $sum: 1 } } },
      ]),
    ]);
    res.json({ success: true, data: { summary: summary[0] || { total_deals: 0, total_value: 0, weighted_value: 0 }, stage_counts: stageCounts } });
  } catch (err) { next(err); }
};

export const listDeals = async (req, res, next) => {
  try {
    const deals = await Deal.find(req.rbacFilter || {}).populate('assigned_to', 'name').sort('-createdAt');
    res.json({ success: true, data: deals });
  } catch (err) { next(err); }
};

export const getDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, ...(req.rbacFilter || {}) }).populate('assigned_to', 'name');
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found or access denied' });
    res.json({ success: true, data: deal });
  } catch (err) { next(err); }
};

export const createDeal = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (!data.assigned_to || req.accessLevel === ACCESS_LEVELS.EDIT_OWN) data.assigned_to = req.user._id;
    const deal = await Deal.create(data);
    res.status(201).json({ success: true, data: deal });
  } catch (err) { next(err); }
};

export const updateDeal = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...(req.rbacFilter || {}) };
    const existingDeal = await Deal.findOne(filter);
    if (!existingDeal) return res.status(404).json({ success: false, message: 'Deal not found or access denied' });

    const segment = req.body.segment || existingDeal.segment;
    if (segment?.toLowerCase() === 'government') {
      const targetStage = req.body.deal_stage || existingDeal.deal_stage;
      const restrictedStages = [DEAL_STAGES.PROPOSAL, DEAL_STAGES.NEGOTIATION, DEAL_STAGES.CLOSED_WON];
      if (restrictedStages.includes(targetStage)) {
        const compliance = { ...(existingDeal.vendor_compliance?.toObject() ?? {}), ...(req.body.vendor_compliance || {}) };
        if (!compliance.pencom || !compliance.tax_clearance || !compliance.cac) {
          return res.status(400).json({ success: false, message: 'Government deals cannot progress to Proposal, Negotiation, or Closed Won without full vendor compliance (PENCOM, Tax Clearance, CAC).' });
        }
      }
    }

    const deal = await Deal.findOneAndUpdate(filter, req.body, { new: true });
    res.json({ success: true, data: deal });
  } catch (err) { next(err); }
};

export const bulkCloseStalled = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const result = await Deal.updateMany(
      { deal_stage: { $nin: [DEAL_STAGES.CLOSED_WON, DEAL_STAGES.CLOSED_LOST] }, $or: [{ last_activity_date: { $lt: thirtyDaysAgo } }, { rag_status: RAG_STATUS.RED }] },
      { $set: { deal_stage: DEAL_STAGES.CLOSED_LOST, lost_reason: 'Strategic Cleanup - Stalled Deal', rag_status: RAG_STATUS.RED } }
    );
    res.json({ success: true, message: `Successfully closed ${result.modifiedCount} stalled deals.` });
  } catch (err) { next(err); }
};

export const deleteDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
