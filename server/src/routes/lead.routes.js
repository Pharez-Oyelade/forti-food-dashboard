import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ownerFilter } from '../middleware/ownerFilter.js';
import { fieldFilter } from '../middleware/fieldFilter.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';
import * as lead from '../controllers/lead.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.VIEW));

router.get('/summary', fieldFilter(SECTIONS.PIPELINE), ownerFilter('owner'), lead.getSummary);
router.get('/', fieldFilter(SECTIONS.PIPELINE), ownerFilter('owner'), lead.listLeads);
router.get('/:id', fieldFilter(SECTIONS.PIPELINE), ownerFilter('owner'), lead.getLead);
router.post('/', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT), lead.createLead);
router.put('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT), ownerFilter('owner'), lead.updateLead);
router.post('/:id/convert', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT), ownerFilter('owner'), lead.convertLead);
router.delete('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), lead.deleteLead);

export default router;
