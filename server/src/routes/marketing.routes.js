import express from 'express';
import { InstagramMetric } from '../models/InstagramMetric.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { fieldFilter } from '../middleware/fieldFilter.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';

const router = express.Router();

// Require auth and view access to SOCIAL section
router.use(authenticate);
router.use(authorize(SECTIONS.SOCIAL, ACCESS_LEVELS.VIEW));

// Get summary metrics
router.get('/summary', fieldFilter(SECTIONS.SOCIAL), async (req, res, next) => {
  try {
    const latestMetrics = await InstagramMetric.findOne().sort('-week_ending');
    
    // Get metrics from previous week for delta calculation
    let previousMetrics = null;
    if (latestMetrics) {
      previousMetrics = await InstagramMetric.findOne({ 
        week_ending: { $lt: latestMetrics.week_ending } 
      }).sort('-week_ending');
    }

    res.json({
      success: true,
      data: {
        latest: latestMetrics,
        previous: previousMetrics,
        deltas: {
          followers: (latestMetrics?.total_followers || 0) - (previousMetrics?.total_followers || 0),
          reach: (latestMetrics?.weekly_reach || 0) - (previousMetrics?.weekly_reach || 0),
          engagement: (latestMetrics?.engagement_rate || 0) - (previousMetrics?.engagement_rate || 0),
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// List all metrics (sorted chronologically for charts)
router.get('/', fieldFilter(SECTIONS.SOCIAL), async (req, res, next) => {
  try {
    const metrics = await InstagramMetric.find({}).sort('week_ending');
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
});

// Create metrics
router.post('/', authorize(SECTIONS.SOCIAL, ACCESS_LEVELS.EDIT), async (req, res, next) => {
  try {
    const metrics = await InstagramMetric.create(req.body);
    res.status(201).json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
});

// Update metrics
router.put('/:id', authorize(SECTIONS.SOCIAL, ACCESS_LEVELS.EDIT), async (req, res, next) => {
  try {
    const metrics = await InstagramMetric.findById(req.params.id);
    if (!metrics) {
      return res.status(404).json({ success: false, message: 'Metrics not found' });
    }
    Object.assign(metrics, req.body);
    await metrics.save();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
});

// Delete metrics
router.delete('/:id', authorize(SECTIONS.SOCIAL, ACCESS_LEVELS.FULL), async (req, res, next) => {
  try {
    const metrics = await InstagramMetric.findByIdAndDelete(req.params.id);
    if (!metrics) {
      return res.status(404).json({ success: false, message: 'Metrics not found' });
    }
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
