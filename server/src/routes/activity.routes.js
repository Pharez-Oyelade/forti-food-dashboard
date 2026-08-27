import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createActivitySchema, updateActivitySchema } from '../validators/activity.validators.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';
import { activityOwnerFilter, getSummary, listActivities, createActivity, updateActivity, deleteActivity } from '../controllers/activity.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.VIEW));

router.get('/summary', activityOwnerFilter, getSummary);
router.get('/', activityOwnerFilter, listActivities);
router.post('/', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT_OWN), validate(createActivitySchema), createActivity);
router.put('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT_OWN), validate(updateActivitySchema), activityOwnerFilter, updateActivity);
router.delete('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), deleteActivity);

export default router;
