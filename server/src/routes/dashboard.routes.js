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
            $sum: { $multiply: ["$value_naira", { $divide: ["$probability_pct", 100] }] },
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
            $sum: { $multiply: ["$unit_cost", "$units_on_hand"] },
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
        socialEngagementDelta = latestEngagement - (recentMetrics[1].engagement_rate || 0);
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

// Historical Timeline Data
router.get("/timeline", async (req, res, next) => {
  try {
    const { WeeklySnapshot } = await import("../models/WeeklySnapshot.js");

    const snapshots = await WeeklySnapshot.find({}).sort("week_ending").lean();

    // Build weekly array (raw snapshots, formatted for charts)
    const weekly = snapshots.map((s) => ({
      date: s.week_ending,
      label: new Date(s.week_ending).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      pipeline_value: s.pipeline?.weighted_value || 0,
      total_deals: s.pipeline?.total_deals || 0,
      stock_value: s.inventory?.total_stock_value || 0,
      expiry_risks: s.inventory?.expiry_risks || 0,
      meals_delivered: s.programs?.meals_delivered || 0,
      active_schools: s.programs?.active_schools || 0,
      engagement_rate: s.social?.engagement_rate || 0,
      open_gaps: s.gaps?.open_count || 0,
    }));

    // Build monthly array (group by year-month, take the last week of each month)
    const monthMap = new Map();
    for (const s of snapshots) {
      const d = new Date(s.week_ending);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, s); // last entry per month wins (sorted ascending)
    }

    const monthly = Array.from(monthMap.entries()).map(([key, s]) => ({
      date: s.week_ending,
      label: new Date(s.week_ending).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      }),
      pipeline_value: s.pipeline?.weighted_value || 0,
      total_deals: s.pipeline?.total_deals || 0,
      stock_value: s.inventory?.total_stock_value || 0,
      expiry_risks: s.inventory?.expiry_risks || 0,
      meals_delivered: s.programs?.meals_delivered || 0,
      active_schools: s.programs?.active_schools || 0,
      engagement_rate: s.social?.engagement_rate || 0,
      open_gaps: s.gaps?.open_count || 0,
    }));

    res.json({
      success: true,
      data: { weekly, monthly },
    });
  } catch (error) {
    next(error);
  }
});

// Manual Snapshot Trigger (Admin only)
router.post("/snapshot", async (req, res, next) => {
  try {
    // Only allow users with user_mgmt edit access (admins)
    const role = req.user?.role;
    const adminAccess = role?.permissions?.user_mgmt?.access;
    if (!adminAccess || adminAccess === "none" || adminAccess === "view" || adminAccess === "view_own" || adminAccess === "view_restricted") {
      return res.status(403).json({ success: false, message: "Only admins can trigger snapshots." });
    }

    const { generateWeeklySnapshot } = await import("../services/snapshot.service.js");
    const snapshot = await generateWeeklySnapshot();

    if (!snapshot) {
      return res.status(500).json({ success: false, message: "Snapshot generation failed." });
    }

    res.status(201).json({ success: true, data: snapshot });
  } catch (error) {
    next(error);
  }
});

export default router;
