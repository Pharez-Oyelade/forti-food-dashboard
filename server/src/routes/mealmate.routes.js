import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAccess } from '../middleware/rbac.js';
import { SECTIONS } from '../../../shared/constants.js';
import * as mealmate from '../controllers/mealmate.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAccess(SECTIONS.MEALMATE));

router.get('/funding/summary', mealmate.getFundingSummary);
router.get('/subscribers', mealmate.listSubscribers);

export default router;
