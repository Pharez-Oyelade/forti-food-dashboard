import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getSettings, updateSetting } from '../controllers/settings.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/:key', updateSetting);

export default router;
