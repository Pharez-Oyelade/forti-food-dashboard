import { School } from '../models/School.js';

export const getSummary = async (req, res, next) => {
  try {
    const schools = await School.find({});
    const data = schools.reduce((acc, s) => {
      if (s.status === 'Vetted') acc.vetted_schools++;
      if (s.status === 'Supported') acc.supported_schools++;
      acc.total_pupils += s.pupil_count || 0;
      acc.total_meals_delivered += s.meals_delivered || 0;
      return acc;
    }, { total_schools: schools.length, vetted_schools: 0, supported_schools: 0, total_pupils: 0, total_meals_delivered: 0 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const listSchools = async (req, res, next) => {
  try {
    const schools = await School.find({}).sort('-priority_score');
    res.json({ success: true, data: schools });
  } catch (err) { next(err); }
};

export const getSchool = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: school });
  } catch (err) { next(err); }
};

export const createSchool = async (req, res, next) => {
  try {
    const school = await School.create(req.body);
    res.status(201).json({ success: true, data: school });
  } catch (err) { next(err); }
};

export const updateSchool = async (req, res, next) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: school });
  } catch (err) { next(err); }
};

export const deleteSchool = async (req, res, next) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
