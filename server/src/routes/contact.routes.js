import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ownerFilter as makeOwnerFilter } from '../middleware/ownerFilter.js';
import { SECTIONS, ACCESS_LEVELS } from '../../../shared/constants.js';
import * as contact from '../controllers/contact.controller.js';

const router = express.Router();

// Require pipeline view access minimum
router.use(authenticate);
router.use(authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.VIEW));

// Contact owner filter (Contacts use 'owner' field)
const contactOwnerFilter = makeOwnerFilter('owner');

router.get('/', contactOwnerFilter, contact.listContacts);
router.post('/', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT), contact.createContact);
router.put('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT), contactOwnerFilter, contact.updateContact);
router.post('/:id/convert', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT), contactOwnerFilter, contact.convertToLead);
router.delete('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), contact.deleteContact);

export default router;
