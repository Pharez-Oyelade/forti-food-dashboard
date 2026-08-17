import express from 'express';
import { runAllAutomations } from '../services/automation.service.js';
import { generateWeeklySnapshot } from '../services/snapshot.service.js';

const router = express.Router();

/**
 * Middleware to verify that the request is coming from Vercel Cron.
 * It checks the Authorization header against the CRON_SECRET environment variable.
 */
const verifyCronSecret = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!process.env.CRON_SECRET) {
    console.error("CRON_SECRET environment variable is missing.");
    return res.status(500).json({ success: false, message: "Server misconfiguration: missing CRON_SECRET" });
  }

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: "Unauthorized cron request" });
  }

  next();
};

// Apply the security middleware to all cron routes
router.use(verifyCronSecret);

// GET /api/v1/cron/automations
// Triggered daily by Vercel
router.get('/automations', async (req, res, next) => {
  try {
    console.log("[Vercel Cron] Triggering runAllAutomations...");
    // Run asynchronously to not block the Vercel request
    runAllAutomations()
      .then(() => console.log("[Vercel Cron] runAllAutomations completed successfully."))
      .catch(err => console.error("[Vercel Cron] runAllAutomations failed:", err));
      
    res.status(200).json({ success: true, message: "Automations triggered successfully." });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/cron/snapshot
// Triggered weekly by Vercel
router.get('/snapshot', async (req, res, next) => {
  try {
    console.log("[Vercel Cron] Triggering generateWeeklySnapshot...");
    // Run asynchronously
    generateWeeklySnapshot()
      .then(() => console.log("[Vercel Cron] generateWeeklySnapshot completed successfully."))
      .catch(err => console.error("[Vercel Cron] generateWeeklySnapshot failed:", err));
      
    res.status(200).json({ success: true, message: "Weekly snapshot triggered successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
