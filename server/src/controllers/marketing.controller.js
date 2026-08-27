import { InstagramMetric } from '../models/InstagramMetric.js';

export const getSummary = async (req, res, next) => {
  try {
    const [latest, previous] = await Promise.all([
      InstagramMetric.findOne().sort('-week_ending'),
      InstagramMetric.findOne().sort('-week_ending').skip(1),
    ]);
    res.json({
      success: true,
      data: {
        latest, previous,
        deltas: {
          followers: (latest?.total_followers ?? 0) - (previous?.total_followers ?? 0),
          reach: (latest?.weekly_reach ?? 0) - (previous?.weekly_reach ?? 0),
          engagement: (latest?.engagement_rate ?? 0) - (previous?.engagement_rate ?? 0),
        },
      },
    });
  } catch (err) { next(err); }
};

export const listMetrics = async (req, res, next) => {
  try {
    const metrics = await InstagramMetric.find({}).sort('week_ending');
    res.json({ success: true, data: metrics });
  } catch (err) { next(err); }
};

export const createMetrics = async (req, res, next) => {
  try {
    const metrics = await InstagramMetric.create(req.body);
    res.status(201).json({ success: true, data: metrics });
  } catch (err) { next(err); }
};

export const updateMetrics = async (req, res, next) => {
  try {
    const metrics = await InstagramMetric.findById(req.params.id);
    if (!metrics) return res.status(404).json({ success: false, message: 'Metrics not found' });
    Object.assign(metrics, req.body);
    await metrics.save();
    res.json({ success: true, data: metrics });
  } catch (err) { next(err); }
};

export const deleteMetrics = async (req, res, next) => {
  try {
    const metrics = await InstagramMetric.findByIdAndDelete(req.params.id);
    if (!metrics) return res.status(404).json({ success: false, message: 'Metrics not found' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
