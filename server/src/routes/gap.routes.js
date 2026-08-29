import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';
import * as gap from '../controllers/gap.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize(SECTIONS.BUSINESS_GAPS, ACCESS_LEVELS.VIEW), gap.listGaps);
router.post('/', authorize(SECTIONS.BUSINESS_GAPS, ACCESS_LEVELS.EDIT), gap.createGap);
router.put('/:id', authorize(SECTIONS.BUSINESS_GAPS, ACCESS_LEVELS.EDIT), gap.updateGap);
router.delete('/:id', authorize(SECTIONS.BUSINESS_GAPS, ACCESS_LEVELS.DELETE), gap.deleteGap);

export default router;
