import { Product } from "../models/Product.js";
import { Deal } from "../models/Deal.js";
import { InstagramMetric } from "../models/InstagramMetric.js";
import { BusinessGap } from "../models/BusinessGap.js";
import User from "../models/User.js";
import { Subscriber } from "../models/Subscriber.js";
import { INVENTORY_STATUS, DEAL_STAGES, FORECAST_CATEGORIES } from "../../../shared/constants.js";

/**
 * Forti Foods - Intelligent Automation Engine
 * Runs nightly via node-cron
 */

// Helper to get system user ID for "created_by"
const getSystemUserId = async () => {
  let systemUser = await User.findOne({ email: "system@fortifoods.com" });
  if (!systemUser) {
    const mongoose = (await import('mongoose')).default;
    const adminRole = await mongoose.model('Role').findOne({ name: 'Admin' });
    let roleId = adminRole ? adminRole._id : new mongoose.Types.ObjectId();
    
    systemUser = await User.create({
      name: "System AI",
      email: "system@fortifoods.com",
      password: "auto-generated-not-used",
      role: roleId,
    });
  }
  return systemUser._id;
};

// 1. Inventory Risk Pass
export const runInventoryPass = async () => {
  console.log("[Automation Engine] Running Inventory Pass...");
  const systemUserId = await getSystemUserId();
  
  const products = await Product.find({});
  let riskCount = 0;
  let resolveCount = 0;

  for (const product of products) {
    const unitsOnHand = product.units_on_hand || 0;
    const soldPerWeek = product.sold_per_week || 0.1;
    
    let isAtRisk = false;
    let isExpired = false;
    
    if (product.expiry_date) {
      const now = new Date();
      const expiry = new Date(product.expiry_date);
      
      if (product.category === 'Food') {
        if (expiry <= now) {
          isExpired = true;
        } else {
          const weeksUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7);
          const weeksOfCover = unitsOnHand / soldPerWeek;
          
          if (weeksOfCover > weeksUntilExpiry) {
            isAtRisk = true;
          }
        }
      }
    }

    let newStatus = product.status;
    if (isExpired) newStatus = INVENTORY_STATUS.EXPIRED;
    else if (unitsOnHand <= 0) newStatus = INVENTORY_STATUS.DEPLETED;
    else if (unitsOnHand <= (product.reorder_point || 100)) newStatus = INVENTORY_STATUS.REORDER;
    else if (isAtRisk) newStatus = INVENTORY_STATUS.AT_RISK;
    else newStatus = INVENTORY_STATUS.OK;

    if (newStatus !== product.status) {
      product.status = newStatus;
      await product.save();
    }
      
    // Handle Business Gap creation/resolution
    const gapTitle = `Inventory Risk: ${product.sku}`;
    const totalValue = unitsOnHand * product.unit_cost;
    const meetsThreshold = (isAtRisk || isExpired) && totalValue > 50000;
    
    const existingGap = await BusinessGap.findOne({
      title: gapTitle,
      status: "OPEN",
      is_automated: true
    });

    if (meetsThreshold) {
      if (!existingGap) {
        riskCount++;
        await BusinessGap.create({
          title: gapTitle,
          description: `Automated alert. ${product.sku} is marked ${newStatus}. Total Value at Risk: ₦${totalValue.toLocaleString()}. Weeks of cover exceeds time to expiry.`,
          severity: isExpired ? "HIGH" : "MEDIUM",
          status: "OPEN",
          department_tags: ["Inventory"],
          owner: "Inventory Manager",
          created_by: systemUserId,
          is_automated: true
        });
      } else {
        // Update description with latest value
        existingGap.description = `Automated alert. ${product.sku} is marked ${newStatus}. Total Value at Risk: ₦${totalValue.toLocaleString()}. Weeks of cover exceeds time to expiry.`;
        existingGap.severity = isExpired ? "HIGH" : "MEDIUM";
        await existingGap.save();
      }
    } else if (existingGap) {
      // It's no longer at risk, resolve the gap!
      existingGap.status = "RESOLVED";
      await existingGap.save();
      resolveCount++;
    }
  }
  
  console.log(`[Automation Engine] Inventory Pass Complete. Logged ${riskCount} new gaps, resolved ${resolveCount}.`);
};

// 2. Social Media Performance Pass
export const runSocialPass = async () => {
  console.log("[Automation Engine] Running Social Pass...");
  const systemUserId = await getSystemUserId();
  
  const metrics = await InstagramMetric.find().sort("-week_ending").limit(2);
  if (metrics.length === 2) {
    const latest = metrics[0].engagement_rate || 0;
    const previous = metrics[1].engagement_rate || 0;
    
    // If engagement drops by > 10% WoW
    if (previous > 0) {
      const dropPct = ((previous - latest) / previous) * 100;
      if (dropPct >= 10) {
        // Prevent duplicate for the same week's drop
        const title = `Social Engagement Drop (${metrics[0].week_ending.toISOString().split('T')[0]})`;
        const existingGap = await BusinessGap.findOne({ title });
        
        if (!existingGap) {
          await BusinessGap.create({
            title,
            description: `Automated alert. Instagram engagement dropped by ${dropPct.toFixed(1)}% this week (from ${previous}% to ${latest}%).`,
            severity: "MEDIUM",
            status: "OPEN",
            department_tags: ["Marketing"],
            owner: "Marketing Lead",
            created_by: systemUserId,
            is_automated: true
          });
          console.log("[Automation Engine] Logged Social Gap.");
        }
      }
    }
  }
};

// 3. Pipeline Health Pass
export const runPipelinePass = async () => {
  console.log("[Automation Engine] Running Pipeline Pass...");
  const systemUserId = await getSystemUserId();
  
  const commitDealsCount = await Deal.countDocuments({
    deal_stage: { $nin: [DEAL_STAGES.CLOSED_WON, DEAL_STAGES.CLOSED_LOST, DEAL_STAGES.CANCELLED] },
    forecast_category: FORECAST_CATEGORIES.COMMIT
  });
  
  const existingGap = await BusinessGap.findOne({ 
    title: "Critically Low Pipeline Commit",
    status: "OPEN",
    is_automated: true
  });

  if (commitDealsCount === 0) {
    if (!existingGap) {
      await BusinessGap.create({
        title: "Critically Low Pipeline Commit",
        description: `Automated alert. There are 0 open deals in the "Commit" forecast category.`,
        severity: "HIGH",
        status: "OPEN",
        department_tags: ["Sales"],
        owner: "Head of Sales",
        created_by: systemUserId,
        is_automated: true
      });
      console.log("[Automation Engine] Logged Pipeline Gap.");
    }
  } else if (existingGap) {
    // We have commit deals now, resolve it!
    existingGap.status = "RESOLVED";
    await existingGap.save();
    console.log("[Automation Engine] Resolved Pipeline Gap.");
  }
};

// 4. Subscriber Risk Pass
export const runSubscriberPass = async () => {
  console.log("[Automation Engine] Running Subscriber Pass...");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await Subscriber.updateMany(
    { last_payment_date: { $lt: thirtyDaysAgo }, status: { $ne: "At-Risk" } },
    { $set: { status: "At-Risk" } }
  );
};

// Orchestrator
export const runAllAutomations = async () => {
  try {
    await runInventoryPass();
    await runSocialPass();
    await runPipelinePass();
    await runSubscriberPass();
  } catch (err) {
    console.error("[Automation Engine] Failed during execution:", err);
  }
};
