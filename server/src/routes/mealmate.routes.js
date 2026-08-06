import express from 'express';
import { Subscriber } from '../models/Subscriber.js';
import { Donation } from '../models/Donation.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, requireAccess } from '../middleware/rbac.js';
import { SECTIONS, ACCESS_LEVELS } from '../../../shared/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAccess(SECTIONS.MEALMATE));

// GET /api/v1/mealmate/funding/summary
router.get('/funding/summary', async (req, res, next) => {
  try {
    const [subscribers, donations] = await Promise.all([
      Subscriber.find({}),
      Donation.find({}),
    ]);

    let totalSubscribers = subscribers.length;
    let activeSubscribers = 0;
    let atRiskSubscribers = 0;
    let monthlySubRevenueNgn = 0;
    let monthlySubRevenueUsd = 0;

    subscribers.forEach(sub => {
      if (sub.status === 'Active') activeSubscribers++;
      if (sub.status === 'At-Risk') atRiskSubscribers++;
      
      if (sub.status !== 'Churned') {
        if (sub.currency === 'NGN') monthlySubRevenueNgn += sub.amount;
        else if (sub.currency === 'USD') monthlySubRevenueUsd += sub.amount;
      }
    });

    let totalDonationsNgn = 0;
    let totalDonationsUsd = 0;
    donations.forEach(don => {
      if (don.currency === 'NGN') totalDonationsNgn += don.amount;
      else if (don.currency === 'USD') totalDonationsUsd += don.amount;
    });

    res.json({
      success: true,
      data: {
        totalSubscribers,
        activeSubscribers,
        atRiskSubscribers,
        monthlySubRevenueNgn,
        monthlySubRevenueUsd,
        totalDonationsNgn,
        totalDonationsUsd,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/mealmate/subscribers
router.get('/subscribers', async (req, res, next) => {
  try {
    const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: subscribers
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/mealmate/sync-payments (STUB)
router.post('/sync-payments', async (req, res, next) => {
  try {
    // In the future, this endpoint will integrate with the Stripe and Paystack APIs.
    // It will fetch recent events and update the last_payment_date and status for subscribers.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({
      success: true,
      message: "Payments synchronized successfully (STUB)"
    });
  } catch (error) {
    next(error);
  }
});

export default router;
