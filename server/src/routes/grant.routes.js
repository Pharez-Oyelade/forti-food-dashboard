import express from 'express';
import { Grant } from '../models/Grant.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createGrantSchema, updateGrantSchema } from '../validators/grant.validators.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';

const router = express.Router();

router.use(authenticate);
// Grants require at least EDIT on PIPELINE based on the new restriction
router.use(authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT));

router.get('/summary', async (req, res, next) => {
  try {
    const total = await Grant.countDocuments();
    const valueByStatus = await Grant.aggregate([
      { $group: { _id: '$status', total_value: { $sum: '$award_amount' }, count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: { total, valueByStatus } });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const grants = await Grant.find()
      .populate('assigned_to', 'name')
      .sort('-createdAt');
    res.json({ success: true, data: grants });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const grant = await Grant.findById(req.params.id).populate('assigned_to', 'name');
    if (!grant) return res.status(404).json({ success: false, message: 'Grant not found' });
    res.json({ success: true, data: grant });
  } catch (err) { next(err); }
});

router.post('/', validate(createGrantSchema), async (req, res, next) => {
  try {
    const data = { ...req.body };
    const grant = await Grant.create(data);
    res.status(201).json({ success: true, data: grant });
  } catch (err) { next(err); }
});

router.put('/:id', validate(updateGrantSchema), async (req, res, next) => {
  try {
    const grant = await Grant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!grant) return res.status(404).json({ success: false, message: 'Grant not found' });
    res.json({ success: true, data: grant });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), async (req, res, next) => {
  try {
    const grant = await Grant.findByIdAndDelete(req.params.id);
    if (!grant) return res.status(404).json({ success: false, message: 'Grant not found' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
