import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getWeeklySummary } from '../controllers/report.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/weekly-summary', getWeeklySummary);

export default router;
