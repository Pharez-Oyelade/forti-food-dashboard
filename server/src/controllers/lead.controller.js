import { Lead } from '../models/Lead.js';
import { Deal } from '../models/Deal.js';
import { ACCESS_LEVELS, DEAL_STAGES, RAG_STATUS } from '../../../shared/constants.js';

export const getSummary = async (req, res, next) => {
  try {
    const filter = { ...(req.rbacFilter || {}), is_promoted: false };
    const [summary, stageCounts] = await Promise.all([
      Lead.aggregate([
        { $match: filter },
        { $group: { _id: null, total_leads: { $sum: 1 }, ready_to_promote: { $sum: { $cond: ['$is_ready_to_promote', 1, 0] } } } },
      ]),
      Lead.aggregate([
        { $match: filter },
        { $group: { _id: '$lead_stage', count: { $sum: 1 } } },
      ]),
    ]);
    res.json({ success: true, data: { summary: summary[0] || { total_leads: 0, ready_to_promote: 0 }, stage_counts: stageCounts } });
  } catch (err) { next(err); }
};

export const listLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find({ ...(req.rbacFilter || {}), is_promoted: false }).populate('owner', 'name').sort('-createdAt');
    res.json({ success: true, data: leads });
  } catch (err) { next(err); }
};

export const getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...(req.rbacFilter || {}) }).populate('owner', 'name');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    res.json({ success: true, data: lead });
  } catch (err) { next(err); }
};

export const createLead = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.accessLevel === ACCESS_LEVELS.EDIT_OWN || !data.owner) data.owner = req.user._id;
    const lead = await Lead.create(data);
    res.status(201).json({ success: true, data: lead });
  } catch (err) { next(err); }
};

export const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...(req.rbacFilter || {}) });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    Object.assign(lead, req.body);
    await lead.save();
    res.json({ success: true, data: lead });
  } catch (err) { next(err); }
};

export const convertLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...(req.rbacFilter || {}) });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (lead.is_promoted) return res.status(400).json({ success: false, message: 'Lead already converted' });
    if (!lead.is_ready_to_promote) return res.status(400).json({ success: false, message: 'Lead does not meet all 4 gate criteria for promotion' });

    const deal = await Deal.create({
      deal_name: lead.lead_name, company: lead.company,
      deal_stage: DEAL_STAGES.PROSPECTING, value_naira: lead.rough_deal_size || 0,
      probability_pct: 20, assigned_to: lead.owner, rag_status: RAG_STATUS.AMBER,
    });

    lead.is_promoted = true;
    lead.deal_id = deal._id;
    lead.lead_stage = 'Qualified';
    await lead.save();

    res.json({ success: true, data: { lead, deal } });
  } catch (err) { next(err); }
};

export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
