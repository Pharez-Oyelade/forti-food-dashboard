import { Deal } from '../models/Deal.js';
import { ACCESS_LEVELS, SECTIONS, DEAL_STAGES } from '../../../shared/constants.js';

export const getPerformance = async (req, res, next) => {
  try {
    const pipelineAccess = req.user.role.permissions[SECTIONS.PIPELINE].access;
    const isRestrictedView = pipelineAccess === ACCESS_LEVELS.VIEW_RESTRICTED;
    const filter = (pipelineAccess === ACCESS_LEVELS.EDIT_OWN || pipelineAccess === ACCESS_LEVELS.VIEW_OWN)
      ? { assigned_to: req.user._id } : {};

    const deals = await Deal.find(filter).populate('assigned_to', 'name');

    const statsMap = {};
    for (const deal of deals) {
      const id = deal.assigned_to?._id?.toString() ?? 'unassigned';
      const name = deal.assigned_to?.name ?? 'Unassigned';

      if (!statsMap[id]) {
        statsMap[id] = { userId: id, name, totalDeals: 0, wonDeals: 0, lostDeals: 0, totalValue: 0, _totalDaysToClose: 0 };
      }

      const s = statsMap[id];
      s.totalDeals++;

      if (deal.deal_stage === DEAL_STAGES.CLOSED_WON) {
        if (!isRestrictedView) s.totalValue += deal.value_naira || 0;
        s.wonDeals++;
        s._totalDaysToClose += Math.ceil((new Date(deal.updatedAt) - new Date(deal.createdAt)) / (1000 * 60 * 60 * 24));
      } else if (deal.deal_stage === DEAL_STAGES.CLOSED_LOST) {
        s.lostDeals++;
      }
    }

    const performance = Object.values(statsMap).map(({ _totalDaysToClose, ...s }) => ({
      ...s,
      conversionRate: s.totalDeals > 0 ? ((s.wonDeals / s.totalDeals) * 100).toFixed(1) : 0,
      avgDaysToClose: s.wonDeals > 0 ? Math.ceil(_totalDaysToClose / s.wonDeals) : 0,
      totalValue: isRestrictedView ? undefined : s.totalValue,
    }));

    res.json({ success: true, data: performance });
  } catch (err) { next(err); }
};
