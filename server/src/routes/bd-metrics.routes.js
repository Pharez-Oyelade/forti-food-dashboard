import express from 'express';
import { Deal } from '../models/Deal.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ACCESS_LEVELS, SECTIONS, DEAL_STAGES } from '../../../shared/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(SECTIONS.PIPELINE, ACCESS_LEVELS.VIEW));

router.get('/performance', async (req, res, next) => {
  try {
    const pipelineAccess = req.user.role.permissions[SECTIONS.PIPELINE].access;
    
    // If edit_own, only show own metrics. Otherwise show all.
    const filter = (pipelineAccess === ACCESS_LEVELS.EDIT_OWN || pipelineAccess === ACCESS_LEVELS.VIEW_OWN)
      ? { assigned_to: req.user._id }
      : {};

    const deals = await Deal.find(filter).populate('assigned_to', 'name');

    // Aggregate by user
    const userStats = {};

    deals.forEach(deal => {
      const userId = deal.assigned_to ? deal.assigned_to._id.toString() : 'unassigned';
      const userName = deal.assigned_to ? deal.assigned_to.name : 'Unassigned';

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          name: userName,
          totalDeals: 0,
          wonDeals: 0,
          lostDeals: 0,
          totalValue: 0,
          avgDaysToClose: 0,
          _totalDaysToClose: 0,
        };
      }

      const stats = userStats[userId];
      stats.totalDeals++;

      if (deal.deal_stage === DEAL_STAGES.CLOSED_WON) {
        if (pipelineAccess !== ACCESS_LEVELS.VIEW_RESTRICTED) {
          stats.totalValue += deal.value_naira || 0;
        } else {
          stats.totalValue = undefined;
        }
        stats.wonDeals++;
        // Rough estimation of days to close
        const createdDate = new Date(deal.createdAt);
        const closedDate = new Date(deal.updatedAt);
        stats._totalDaysToClose += Math.ceil((closedDate - createdDate) / (1000 * 60 * 60 * 24));
      } else if (deal.deal_stage === DEAL_STAGES.CLOSED_LOST) {
        stats.lostDeals++;
      }
    });

    const performance = Object.values(userStats).map(stats => {
      const conversionRate = stats.totalDeals > 0 
        ? ((stats.wonDeals / stats.totalDeals) * 100).toFixed(1) 
        : 0;
      
      const avgDaysToClose = stats.wonDeals > 0
        ? Math.ceil(stats._totalDaysToClose / stats.wonDeals)
        : 0;

      return {
        userId: stats.userId,
        name: stats.name,
        totalDeals: stats.totalDeals,
        wonDeals: stats.wonDeals,
        lostDeals: stats.lostDeals,
        conversionRate,
        totalValue: stats.totalValue,
        avgDaysToClose
      };
    });

    res.json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
});

export default router;
