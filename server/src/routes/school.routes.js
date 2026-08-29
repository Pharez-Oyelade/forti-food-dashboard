import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';
import * as school from '../controllers/school.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.VIEW), school.getSummary);
router.get('/', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.VIEW), school.listSchools);
router.get('/:id', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.VIEW), school.getSchool);
router.post('/', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.EDIT), school.createSchool);
router.put('/:id', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.EDIT), school.updateSchool);
router.delete('/:id', authorize(SECTIONS.MEALMATE, ACCESS_LEVELS.FULL), school.deleteSchool);

export default router;
