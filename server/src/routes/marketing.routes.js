import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { fieldFilter } from '../middleware/fieldFilter.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';
import * as marketing from '../controllers/marketing.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(SECTIONS.SOCIAL, ACCESS_LEVELS.VIEW));

router.get('/summary', fieldFilter(SECTIONS.SOCIAL), marketing.getSummary);
router.get('/', fieldFilter(SECTIONS.SOCIAL), marketing.listMetrics);
router.post('/', authorize(SECTIONS.SOCIAL, ACCESS_LEVELS.EDIT), marketing.createMetrics);
router.put('/:id', authorize(SECTIONS.SOCIAL, ACCESS_LEVELS.EDIT), marketing.updateMetrics);
router.delete('/:id', authorize(SECTIONS.SOCIAL, ACCESS_LEVELS.FULL), marketing.deleteMetrics);

export default router;
