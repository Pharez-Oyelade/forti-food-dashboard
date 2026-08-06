import { Deal } from '../models/Deal.js';
import { Product } from '../models/Product.js';
import { School } from '../models/School.js';
import { InstagramMetric } from '../models/InstagramMetric.js';
import { BusinessGap } from '../models/BusinessGap.js';
import { WeeklySnapshot } from '../models/WeeklySnapshot.js';
import { DEAL_STAGES, INVENTORY_STATUS } from '../../../shared/constants.js';

export const generateWeeklySnapshot = async () => {
  try {
    console.log('[Snapshot Service] Generating weekly snapshot...');
    
    // 1. Pipeline (Active Deals only)
    const pipelineData = await Deal.aggregate([
      {
        $match: {
          deal_stage: { $nin: [DEAL_STAGES.CLOSED_WON, DEAL_STAGES.CLOSED_LOST, DEAL_STAGES.CANCELLED] },
        },
      },
      {
        $group: {
          _id: null,
          total_deals: { $sum: 1 },
          total_value: { $sum: "$value_naira" },
          weighted_value: {
            $sum: { $multiply: ["$value_naira", { $divide: ["$probability_pct", 100] }] },
          },
        },
      },
    ]);

    // 2. Inventory
    const products = await Product.find({});
    let total_skus = products.length;
    let total_stock_value = 0;
    let depleted_count = 0;
    let expiry_risks = 0;
    
    products.forEach(p => {
      total_stock_value += (p.units_on_hand * p.unit_cost) || 0;
      if (p.status === INVENTORY_STATUS.DEPLETED || p.units_on_hand === 0) {
        depleted_count++;
      }
      if (p.status === INVENTORY_STATUS.EXPIRED || p.status === INVENTORY_STATUS.AT_RISK) {
        expiry_risks++;
      }
    });

    // 3. Programs
    const programsData = await School.aggregate([
      {
        $group: {
          _id: null,
          total_meals_delivered: { $sum: "$meals_delivered" },
          total_schools_active: {
            $sum: { $cond: [{ $eq: ["$status", "Supported"] }, 1, 0] },
          },
        },
      },
    ]);

    // 4. Social Media
    const recentMetrics = await InstagramMetric.find().sort("-week_ending").limit(2);
    let socialEngagementDelta = 0;
    let latestEngagement = 0;
    if (recentMetrics.length > 0) {
      latestEngagement = recentMetrics[0].engagement_rate || 0;
      if (recentMetrics.length > 1) {
        socialEngagementDelta = latestEngagement - (recentMetrics[1].engagement_rate || 0);
      }
    }

    // 5. Gaps
    const openGapsCount = await BusinessGap.countDocuments({ status: { $ne: "RESOLVED" } });

    // Create Snapshot
    const snapshot = await WeeklySnapshot.create({
      week_ending: new Date(),
      pipeline: {
        total_deals: pipelineData[0]?.total_deals || 0,
        total_value: pipelineData[0]?.total_value || 0,
        weighted_value: pipelineData[0]?.weighted_value || 0,
      },
      inventory: {
        total_skus,
        total_stock_value,
        depleted_count,
        expiry_risks,
      },
      programs: {
        meals_delivered: programsData[0]?.total_meals_delivered || 0,
        active_schools: programsData[0]?.total_schools_active || 0,
      },
      social: {
        engagement_rate: latestEngagement,
        engagement_delta: socialEngagementDelta,
      },
      gaps: {
        open_count: openGapsCount,
      }
    });

    console.log('[Snapshot Service] Weekly snapshot generated successfully.');
    return snapshot;
  } catch (error) {
    console.error('[Snapshot Service] Failed to generate snapshot:', error);
  }
};
