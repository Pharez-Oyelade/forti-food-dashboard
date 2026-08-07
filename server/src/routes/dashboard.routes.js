import express from "express";
import { Deal } from "../models/Deal.js";
import { Product } from "../models/Product.js";
import { School } from "../models/School.js";
import { InstagramMetric } from "../models/InstagramMetric.js";
import { BusinessGap } from "../models/BusinessGap.js";
import { authenticate } from "../middleware/auth.js";
import { DEAL_STAGES, INVENTORY_STATUS } from "../../../shared/constants.js";

const router = express.Router();

router.use(authenticate);

// Aggregated Dashboard Summary
router.get("/summary", async (req, res, next) => {
  try {
    // 1. Sales Pipeline
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
            $sum: { 
              $multiply: [
                { $ifNull: ["$value_naira", 0] }, 
                { $divide: [{ $ifNull: ["$probability_pct", 0] }, 100] }
              ] 
            },
          },
        },
      },
    ]);

    // 2. Inventory Risk
    const inventoryRiskData = await Product.aggregate([
      {
        $match: {
          status: { $in: [INVENTORY_STATUS.AT_RISK, INVENTORY_STATUS.EXPIRED] },
        },
      },
      {
        $group: {
          _id: null,
          total_risk_value: {
            $sum: { 
              $multiply: [
                { $ifNull: ["$unit_cost", 0] }, 
                { $ifNull: ["$units_on_hand", 0] }
              ] 
            },
          },
          risk_items_count: { $sum: 1 },
        },
      },
    ]);

    // 3. Programs (Meals Delivered)
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

    // 4. Social Media (Engagement Delta)
    const recentMetrics = await InstagramMetric.find().sort("-week_ending").limit(2);
    let socialEngagementDelta = 0;
    let latestEngagement = 0;
    if (recentMetrics.length > 0) {
      latestEngagement = recentMetrics[0].engagement_rate || 0;
      if (recentMetrics.length > 1) {
        // Only calculate delta if the previous metric is strictly from the previous week (allow up to 8 days gap for wiggle room)
        const diffTime = Math.abs(new Date(recentMetrics[0].week_ending) - new Date(recentMetrics[1].week_ending));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 8) {
          socialEngagementDelta = latestEngagement - (recentMetrics[1].engagement_rate || 0);
        }
      }
    }

    // 5. Open Business Gaps
    const openGapsCount = await BusinessGap.countDocuments({ status: { $ne: "RESOLVED" } });

    res.json({
      success: true,
      data: {
        pipeline: {
          total_deals: pipelineData[0]?.total_deals || 0,
          total_value: pipelineData[0]?.total_value || 0,
          weighted_value: pipelineData[0]?.weighted_value || 0,
        },
        inventory: {
          risk_value: inventoryRiskData[0]?.total_risk_value || 0,
          risk_items: inventoryRiskData[0]?.risk_items_count || 0,
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
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
