import { WeeklySnapshot } from '../models/WeeklySnapshot.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';

export const getWeeklySummary = async (req, res, next) => {
  try {
    const snapshot = await WeeklySnapshot.findOne().sort({ createdAt: -1 });
    if (!snapshot) return res.json({ success: true, data: null });

    const perms = req.user.role.permissions;
    const hasAccess = (section) => perms[section]?.access && perms[section].access !== ACCESS_LEVELS.NONE;
    const isRestricted = (section) => perms[section]?.access === ACCESS_LEVELS.VIEW_RESTRICTED;

    const summary = { week_ending: snapshot.week_ending, createdAt: snapshot.createdAt };

    if (hasAccess(SECTIONS.PIPELINE)) {
      summary.pipeline = {
        total_deals: snapshot.pipeline.total_deals,
        total_value: isRestricted(SECTIONS.PIPELINE) ? undefined : snapshot.pipeline.total_value,
        weighted_value: isRestricted(SECTIONS.PIPELINE) ? undefined : snapshot.pipeline.weighted_value,
      };
    }
    if (hasAccess(SECTIONS.INVENTORY)) {
      summary.inventory = {
        total_skus: snapshot.inventory.total_skus,
        depleted_count: snapshot.inventory.depleted_count,
        expiry_risks: snapshot.inventory.expiry_risks,
        total_stock_value: isRestricted(SECTIONS.INVENTORY) ? undefined : snapshot.inventory.total_stock_value,
      };
    }
    if (hasAccess(SECTIONS.MEALMATE)) summary.programs = snapshot.programs;
    if (hasAccess(SECTIONS.SOCIAL)) summary.social = snapshot.social;
    if (hasAccess(SECTIONS.BUSINESS_GAPS)) summary.gaps = snapshot.gaps;

    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
};
