import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';
import * as user from '../controllers/user.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(SECTIONS.USER_MGMT, ACCESS_LEVELS.FULL));

router.get('/', user.listUsers);
router.get('/roles', user.listRoles);
router.post('/', user.createUser);
router.put('/:id', user.updateUser);

export default router;
