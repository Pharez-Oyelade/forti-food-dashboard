import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { ownerFilter } from '../middleware/ownerFilter.js';
import { fieldFilter } from '../middleware/fieldFilter.js';
import { createDealSchema, updateDealSchema } from '../validators/deal.validators.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';
import * as deal from '../controllers/deal.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.VIEW));

router.get('/summary', fieldFilter(SECTIONS.PIPELINE), ownerFilter(), deal.getSummary);
router.get('/', fieldFilter(SECTIONS.PIPELINE), ownerFilter(), deal.listDeals);
router.get('/:id', fieldFilter(SECTIONS.PIPELINE), ownerFilter(), deal.getDeal);
router.post('/', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT), validate(createDealSchema), deal.createDeal);
router.put('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT), validate(updateDealSchema), ownerFilter(), deal.updateDeal);
router.post('/bulk-close-stalled', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), deal.bulkCloseStalled);
router.delete('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), deal.deleteDeal);

export default router;
