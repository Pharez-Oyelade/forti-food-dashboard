import express from 'express';
import { School } from '../models/School.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';

const router = express.Router();

router.use(authenticate);

// Get summary (stats)
router.get('/summary', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.VIEW), async (req, res, next) => {
  try {
    const schools = await School.find({});
    
    let total_schools = schools.length;
    let vetted_schools = 0;
    let supported_schools = 0;
    let total_pupils = 0;
    let total_meals_delivered = 0;

    schools.forEach(s => {
      if (s.status === 'Vetted') vetted_schools++;
      if (s.status === 'Supported') supported_schools++;
      total_pupils += s.pupil_count || 0;
      total_meals_delivered += s.meals_delivered || 0;
    });

    res.json({
      success: true,
      data: {
        total_schools,
        vetted_schools,
        supported_schools,
        total_pupils,
        total_meals_delivered,
      }
    });
  } catch (error) {
    next(error);
  }
});

// List Schools
router.get('/', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.VIEW), async (req, res, next) => {
  try {
    const schools = await School.find({}).sort('-priority_score');
    res.json({ success: true, data: schools });
  } catch (error) {
    next(error);
  }
});

// Get School
router.get('/:id', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.VIEW), async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    res.json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
});

// Create School
router.post('/', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.EDIT), async (req, res, next) => {
  try {
    const school = await School.create(req.body);
    res.status(201).json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
});

// Update School
router.put('/:id', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.EDIT), async (req, res, next) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    res.json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
});

// Delete School
router.delete('/:id', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.FULL), async (req, res, next) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
