import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { loginSchema } from '../validators/auth.validators.js';
import * as auth from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', validate(loginSchema), auth.login);
router.post('/logout', auth.logout);
router.get('/me', authenticate, auth.getMe);

export default router;
