import { BusinessGap } from '../models/BusinessGap.js';

export const listGaps = async (req, res, next) => {
  try {
    const gaps = await BusinessGap.find().populate('created_by', 'name email').sort('-createdAt');
    res.json({ success: true, data: gaps });
  } catch (err) { next(err); }
};

export const createGap = async (req, res, next) => {
  try {
    const data = { ...req.body, created_by: req.user._id };
    if (data.status === 'RESOLVED') data.resolved_at = new Date();
    const gap = await BusinessGap.create(data);
    res.status(201).json({ success: true, data: gap });
  } catch (err) { next(err); }
};

export const updateGap = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.status === 'RESOLVED') updateData.resolved_at = new Date();
    else if (updateData.status) updateData.resolved_at = null;

    const gap = await BusinessGap.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate('created_by', 'name email');
    if (!gap) return res.status(404).json({ success: false, message: 'Gap not found' });
    res.json({ success: true, data: gap });
  } catch (err) { next(err); }
};

export const deleteGap = async (req, res, next) => {
  try {
    const gap = await BusinessGap.findByIdAndDelete(req.params.id);
    if (!gap) return res.status(404).json({ success: false, message: 'Gap not found' });
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};
