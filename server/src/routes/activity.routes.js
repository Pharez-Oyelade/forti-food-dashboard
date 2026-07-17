import express from 'express';
import { Activity } from '../models/Activity.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createActivitySchema, updateActivitySchema } from '../validators/activity.validators.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';

const router = express.Router();

router.use(authenticate);
// Activity is governed by PIPELINE access
router.use(authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.VIEW));

// Owner filter for activities
const activityOwnerFilter = (req, res, next) => {
  if (req.accessLevel === ACCESS_LEVELS.EDIT_OWN || req.accessLevel === ACCESS_LEVELS.VIEW_OWN) {
    req.rbacFilter = { logged_by: req.user._id };
  }
  next();
};

router.get('/summary', activityOwnerFilter, async (req, res, next) => {
  try {
    const filter = req.rbacFilter || {};
    const summary = await Activity.aggregate([
      { $match: filter },
      { $group: { _id: null, total_activities: { $sum: 1 } } }
    ]);
    const byType = await Activity.aggregate([
      { $match: filter },
      { $group: { _id: '$activity_type', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: {
      total: summary[0]?.total_activities || 0,
      by_type: byType
    }});
  } catch (err) { next(err); }
});

router.get('/', activityOwnerFilter, async (req, res, next) => {
  try {
    const filter = req.rbacFilter || {};
    const activities = await Activity.find(filter)
      .populate('logged_by', 'name')
      .populate('deal', 'deal_name')
      .populate('grant', 'program_name')
      .sort('-activity_date');
    res.json({ success: true, data: activities });
  } catch (err) { next(err); }
});

router.post('/', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT_OWN), validate(createActivitySchema), async (req, res, next) => {
  try {
    const data = { ...req.body, logged_by: req.user._id };
    const activity = await Activity.create(data);
    res.status(201).json({ success: true, data: activity });
  } catch (err) { next(err); }
});

router.put('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT_OWN), validate(updateActivitySchema), activityOwnerFilter, async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...(req.rbacFilter || {}) };
    const activity = await Activity.findOneAndUpdate(filter, req.body, { new: true });
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found or access denied' });
    res.json({ success: true, data: activity });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
