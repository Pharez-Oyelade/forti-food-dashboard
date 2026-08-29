import { Activity } from '../models/Activity.js';
import { ACCESS_LEVELS } from '../../../shared/constants.js';
import { ownerFilter as makeOwnerFilter } from '../middleware/ownerFilter.js';

// Activities use 'logged_by' as the owner field
export const activityOwnerFilter = makeOwnerFilter('logged_by');

export const getSummary = async (req, res, next) => {
  try {
    const filter = req.rbacFilter || {};
    const [summary, byType] = await Promise.all([
      Activity.aggregate([{ $match: filter }, { $group: { _id: null, total_activities: { $sum: 1 } } }]),
      Activity.aggregate([{ $match: filter }, { $group: { _id: '$activity_type', count: { $sum: 1 } } }]),
    ]);
    res.json({ success: true, data: { total: summary[0]?.total_activities ?? 0, by_type: byType } });
  } catch (err) { next(err); }
};

export const listActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find(req.rbacFilter || {})
      .populate('logged_by', 'name').populate('deal', 'deal_name').populate('grant', 'program_name')
      .sort('-activity_date');
    res.json({ success: true, data: activities });
  } catch (err) { next(err); }
};

export const createActivity = async (req, res, next) => {
  try {
    const activity = await Activity.create({ ...req.body, logged_by: req.user._id });
    res.status(201).json({ success: true, data: activity });
  } catch (err) { next(err); }
};

export const updateActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOneAndUpdate({ _id: req.params.id, ...(req.rbacFilter || {}) }, req.body, { new: true });
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found or access denied' });
    res.json({ success: true, data: activity });
  } catch (err) { next(err); }
};

export const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
