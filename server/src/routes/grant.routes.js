import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createGrantSchema, updateGrantSchema } from '../validators/grant.validators.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';
import * as grant from '../controllers/grant.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.EDIT));

router.get('/summary', grant.getSummary);
router.get('/', grant.listGrants);
router.get('/:id', grant.getGrant);
router.post('/', validate(createGrantSchema), grant.createGrant);
router.put('/:id', validate(updateGrantSchema), grant.updateGrant);
router.delete('/:id', authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.FULL), grant.deleteGrant);

export default router;
