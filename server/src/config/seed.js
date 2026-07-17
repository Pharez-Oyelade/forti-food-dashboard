/**
 * Forti Foods — Database Seeder
 *
 * Creates the 8 default roles and one admin user.
 * Idempotent: safe to run multiple times (uses upsert / findOneAndUpdate).
 *
 * Usage:  npm run seed   (from the server directory)
 */

import mongoose from "mongoose";
import env from "./env.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import { Deal } from "../models/Deal.js";
import { Product } from "../models/Product.js";
import { ACCESS_LEVELS, ROLE_NAMES } from "../../../shared/constants.js";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const {
  NONE,
  VIEW,
  VIEW_RESTRICTED,
  VIEW_OWN,
  EDIT,
  EDIT_OWN,
  EDIT_RULES,
  FULL,
} = ACCESS_LEVELS;

// ── Role definitions matching the RBAC matrix ──
const ROLES = [
  {
    role_name: ROLE_NAMES.FOUNDER_ADMIN,
    permissions: {
      inventory: { access: FULL },
      pipeline: { access: FULL },
      mealmate: { access: FULL },
      social: { access: FULL },
      business_gaps: { access: FULL },
      user_mgmt: { access: FULL },
    },
  },
  {
    role_name: ROLE_NAMES.BI_OPS_ANALYST,
    permissions: {
      inventory: { access: EDIT },
      pipeline: { access: EDIT },
      mealmate: { access: EDIT },
      social: { access: EDIT },
      business_gaps: { access: EDIT_RULES },
      user_mgmt: { access: VIEW },
    },
  },
  {
    role_name: ROLE_NAMES.INVENTORY_LEAD,
    permissions: {
      inventory: { access: EDIT },
      pipeline: { access: VIEW },
      mealmate: { access: NONE },
      social: { access: NONE },
      business_gaps: { access: VIEW_OWN },
      user_mgmt: { access: NONE },
    },
  },
  {
    role_name: ROLE_NAMES.SALES_BD_LEAD,
    permissions: {
      inventory: { access: VIEW },
      pipeline: { access: EDIT },
      mealmate: { access: VIEW },
      social: { access: VIEW },
      business_gaps: { access: VIEW_OWN },
      user_mgmt: { access: NONE },
    },
  },
  {
    role_name: ROLE_NAMES.REP,
    permissions: {
      inventory: { access: NONE },
      pipeline: { access: EDIT_OWN },
      mealmate: { access: NONE },
      social: { access: NONE },
      business_gaps: { access: NONE },
      user_mgmt: { access: NONE },
    },
  },
  {
    role_name: ROLE_NAMES.MARKETING_LEAD,
    permissions: {
      inventory: { access: NONE },
      pipeline: { access: VIEW },
      mealmate: { access: VIEW },
      social: { access: EDIT },
      business_gaps: { access: VIEW_OWN },
      user_mgmt: { access: NONE },
    },
  },
  {
    role_name: ROLE_NAMES.PROGRAM_COORDINATOR,
    permissions: {
      inventory: { access: NONE },
      pipeline: { access: NONE },
      mealmate: { access: EDIT },
      social: { access: NONE },
      business_gaps: { access: VIEW_OWN },
      user_mgmt: { access: NONE },
    },
  },
  {
    role_name: ROLE_NAMES.VIEWER_STAKEHOLDER,
    permissions: {
      inventory: { access: VIEW_RESTRICTED },
      pipeline: { access: VIEW_RESTRICTED },
      mealmate: { access: VIEW },
      social: { access: VIEW },
      business_gaps: { access: VIEW },
      user_mgmt: { access: NONE },
    },
  },
];

async function seed() {
  try {
    console.log("[SEED] Connecting to MongoDB…");
    await mongoose.connect(env.MONGO_URI);
    console.log("[SEED] ✅ Connected\n");

    // ── Upsert roles ──
    console.log("[SEED] Upserting roles…");
    const roleResults = {};

    for (const roleDef of ROLES) {
      const role = await Role.findOneAndUpdate(
        { role_name: roleDef.role_name },
        { $set: { ...roleDef, is_system: true } },
        { upsert: true, new: true, runValidators: true },
      );
      roleResults[roleDef.role_name] = role;
      console.log(`  ✔ ${role.role_name}`);
    }

    // ── Upsert default admin user ──
    console.log("\n[SEED] Upserting admin user…");

    const adminRole = roleResults[ROLE_NAMES.FOUNDER_ADMIN];

    const existingAdmin = await User.findOne({ email: env.ADMIN_EMAIL });
    let adminUser = existingAdmin;

    if (existingAdmin) {
      // Update role association (password stays unchanged)
      existingAdmin.role = adminRole._id;
      existingAdmin.name = env.ADMIN_NAME;
      existingAdmin.is_active = true;
      await existingAdmin.save();
      console.log(`  ✔ Admin updated: ${existingAdmin.email}`);
    } else {
      adminUser = await User.create({
        name: env.ADMIN_NAME,
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
        role: adminRole._id,
        is_active: true,
      });
      console.log(`  ✔ Admin created: ${adminUser.email}`);
    }

    // ── Upsert Viewer/Stakeholder user ──
    console.log("\n[SEED] Upserting viewer user…");
    const viewerRole = roleResults[ROLE_NAMES.VIEWER_STAKEHOLDER];
    const viewerEmail = 'viewer@fortifoods.com';
    const existingViewer = await User.findOne({ email: viewerEmail });

    if (existingViewer) {
      existingViewer.role = viewerRole._id;
      existingViewer.name = 'Forti Viewer';
      existingViewer.is_active = true;
      await existingViewer.save();
      console.log(`  ✔ Viewer updated: ${existingViewer.email}`);
    } else {
      await User.create({
        name: 'Forti Viewer',
        email: viewerEmail,
        password: 'changeme123',
        role: viewerRole._id,
        is_active: true,
      });
      console.log(`  ✔ Viewer created: ${viewerEmail}`);
    }

    // ── Seed Products ──
    const productCount = await mongoose.model('Product').countDocuments();
    if (productCount === 0) {
      console.log("\n[SEED] Seeding Products…");
      const products = [
        { product_name: 'Forti-Flakes (500g)', sku: 'FF-500', unit_cost: 450, unit_price: 800, units_on_hand: 1200, units_sold_to_date: 5000, category: 'Cereals', reorder_point: 200 },
        { product_name: 'Forti-Flakes (1kg)', sku: 'FF-1000', unit_cost: 850, unit_price: 1500, units_on_hand: 50, units_sold_to_date: 2000, category: 'Cereals', reorder_point: 100 }, // Slow mover / low stock
        { product_name: 'Nutri-Porridge (Sachet)', sku: 'NP-50', unit_cost: 50, unit_price: 100, units_on_hand: 15000, units_sold_to_date: 100000, category: 'Porridge', reorder_point: 5000 },
        { product_name: 'Nutri-Porridge (Family Pack)', sku: 'NP-2000', unit_cost: 1600, unit_price: 2500, units_on_hand: 0, units_sold_to_date: 300, category: 'Porridge', reorder_point: 50 }, // Depleted
      ];
      for (const p of products) {
        await mongoose.model('Product').create(p);
      }
      console.log(`  ✔ Created ${products.length} products`);
    } else {
      console.log(`\n[SEED] Products already exist (${productCount}). Skipping product seed.`);
    }

    // ── Seed Deals ──
    const dealCount = await mongoose.model('Deal').countDocuments();
    if (dealCount === 0) {
      console.log("\n[SEED] Seeding Deals…");
      const deals = [
        { deal_name: 'Q3 School Feeding Program', company: 'Lagos State Gov', deal_stage: 'Negotiation', value_naira: 15000000, probability_pct: 80, rag_status: 'Green', assigned_to: adminUser._id },
        { deal_name: 'NGO Relief Supply - Borno', company: 'Save the Children', deal_stage: 'Proposal', value_naira: 8500000, probability_pct: 50, rag_status: 'Amber', assigned_to: adminUser._id },
        { deal_name: 'Corporate CSR Package', company: 'Access Bank', deal_stage: 'Qualification', value_naira: 2000000, probability_pct: 20, rag_status: 'Red', assigned_to: adminUser._id },
        { deal_name: 'Military Ration Pilot', company: 'Nigerian Army', deal_stage: 'Prospecting', value_naira: 45000000, probability_pct: 10, rag_status: 'Amber', assigned_to: adminUser._id },
      ];
      for (const d of deals) {
        await mongoose.model('Deal').create(d);
      }
      console.log(`  ✔ Created ${deals.length} deals`);
    } else {
      console.log(`\n[SEED] Deals already exist (${dealCount}). Skipping deal seed.`);
    }

    console.log("\n[SEED] 🎉 Seeding complete!");
  } catch (err) {
    console.error("[SEED] ❌ Error:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("[SEED] Disconnected from MongoDB.");
  }
}

seed();
