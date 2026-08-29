import { Grant } from '../models/Grant.js';

export const getSummary = async (req, res, next) => {
  try {
    const [total, valueByStatus] = await Promise.all([
      Grant.countDocuments(),
      Grant.aggregate([{ $group: { _id: '$status', total_value: { $sum: '$award_amount' }, count: { $sum: 1 } } }]),
    ]);
    res.json({ success: true, data: { total, valueByStatus } });
  } catch (err) { next(err); }
};

export const listGrants = async (req, res, next) => {
  try {
    const grants = await Grant.find().populate('assigned_to', 'name').sort('-createdAt');
    res.json({ success: true, data: grants });
  } catch (err) { next(err); }
};

export const getGrant = async (req, res, next) => {
  try {
    const grant = await Grant.findById(req.params.id).populate('assigned_to', 'name');
    if (!grant) return res.status(404).json({ success: false, message: 'Grant not found' });
    res.json({ success: true, data: grant });
  } catch (err) { next(err); }
};

export const createGrant = async (req, res, next) => {
  try {
    const grant = await Grant.create(req.body);
    res.status(201).json({ success: true, data: grant });
  } catch (err) { next(err); }
};

export const updateGrant = async (req, res, next) => {
  try {
    const grant = await Grant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!grant) return res.status(404).json({ success: false, message: 'Grant not found' });
    res.json({ success: true, data: grant });
  } catch (err) { next(err); }
};

export const deleteGrant = async (req, res, next) => {
  try {
    const grant = await Grant.findByIdAndDelete(req.params.id);
    if (!grant) return res.status(404).json({ success: false, message: 'Grant not found' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
