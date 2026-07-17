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
import { Activity } from "../models/Activity.js";
import { Grant } from "../models/Grant.js";
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

    // ── Upsert BD Lead user (Emmanuella) ──
    console.log("\n[SEED] Upserting BD Lead user…");
    const bdRole = roleResults[ROLE_NAMES.SALES_BD_LEAD];
    const bdEmail = 'bd@fortifoods.com';
    let bdUser = await User.findOne({ email: bdEmail });

    if (bdUser) {
      bdUser.role = bdRole._id;
      bdUser.name = 'Emmanuella';
      bdUser.is_active = true;
      await bdUser.save();
      console.log(`  ✔ BD Lead updated: ${bdUser.email}`);
    } else {
      bdUser = await User.create({
        name: 'Emmanuella',
        email: bdEmail,
        password: 'changeme123',
        role: bdRole._id,
        is_active: true,
      });
      console.log(`  ✔ BD Lead created: ${bdEmail}`);
    }

    // ── Seed Grants ──
    const grantCount = await Grant.countDocuments();
    if (grantCount === 0) {
      console.log("\n[SEED] Seeding Grants…");
      const grants = [
        { program_name: '100+ impact accelerator', funder_organisation: 'Carter Women\'s Initiative', type: 'Accelerator', status: 'Submitted', award_amount: 150000, currency: 'USD', assigned_to: bdUser._id },
        { program_name: 'D-Prize Challenge', funder_organisation: 'D-Prize', type: 'Competition', status: 'Submitted', award_amount: 20000, currency: 'USD', assigned_to: bdUser._id },
        { program_name: 'DRK Foundation', funder_organisation: 'DRK Foundation', type: 'Grant', status: 'Submitted', award_amount: 300000, currency: 'USD', is_rolling: true, assigned_to: bdUser._id },
        { program_name: 'Amber Grants for Women', funder_organisation: 'WomensNet', type: 'Grant', status: 'In Progress', award_amount: 15000, currency: 'USD', assigned_to: bdUser._id },
        { program_name: 'Sustainability Open Innovation Challenge', funder_organisation: 'Enterprise Singapore', type: 'Competition', status: 'In Progress', award_amount: 100000, currency: 'USD', assigned_to: bdUser._id },
        { program_name: 'She Ascends Women Accelerator', funder_organisation: 'She Ascends', type: 'Accelerator', status: 'In Progress', award_amount: 65000, currency: 'USD', assigned_to: bdUser._id },
        { program_name: 'Horizon Europe Green Transition', funder_organisation: 'EU', type: 'Grant', status: 'Submitted', award_amount: 5000000, currency: 'EUR', assigned_to: bdUser._id },
        { program_name: 'Bridge Seed Global Accelerator', funder_organisation: 'Bridge Seed', type: 'Accelerator', status: 'In Progress', award_amount: 5000, currency: 'USD', assigned_to: bdUser._id },
        { program_name: 'Tony Elumelu Foundation', funder_organisation: 'TEF', type: 'Grant', status: 'In Progress', award_amount: 5000, currency: 'USD', assigned_to: bdUser._id },
        { program_name: 'KPMG Female Founders in Africa', funder_organisation: 'KPMG', type: 'Competition', status: 'Submitted', award_amount: 1000000, currency: 'USD', assigned_to: bdUser._id },
        { program_name: 'Cartier Women\'s Initiative', funder_organisation: 'Cartier', type: 'Award', status: 'Researching', award_amount: 100000, currency: 'USD', assigned_to: bdUser._id },
        { program_name: 'Mulago Foundation Fellows', funder_organisation: 'Mulago Foundation', type: 'Fellowship', status: 'Researching', award_amount: 100000, currency: 'USD', assigned_to: bdUser._id },
      ];
      for (const g of grants) {
        await Grant.create(g);
      }
      console.log(`  ✔ Created ${grants.length} grants`);
    } else {
      console.log(`\n[SEED] Grants already exist (${grantCount}). Skipping grant seed.`);
    }

    // ── Seed Activities ──
    const activityCount = await Activity.countDocuments();
    if (activityCount === 0) {
      console.log("\n[SEED] Seeding Activities…");
      const deal1 = await Deal.findOne({ deal_name: 'Q3 School Feeding Program' });
      const deal2 = await Deal.findOne({ deal_name: 'NGO Relief Supply - Borno' });
      const grant1 = await Grant.findOne({ program_name: '100+ impact accelerator' });

      const activities = [
        { activity_type: 'Meeting', subject: 'Initial Alignment Meeting', contact_name: 'Gov Rep', logged_by: adminUser._id, deal: deal1?._id, outcome: 'Positive' },
        { activity_type: 'Email', subject: 'Sent Proposal Draft', contact_name: 'Procurement Lead', logged_by: adminUser._id, deal: deal2?._id, outcome: 'Pending' },
        { activity_type: 'Call', subject: 'Accelerator Clarification', contact_name: 'Carter Team', logged_by: bdUser._id, grant: grant1?._id, outcome: 'Positive' },
        { activity_type: 'Meeting', subject: 'Partnership Kickoff', contact_name: 'Sponsor', logged_by: bdUser._id, outcome: 'Neutral' },
        { activity_type: 'Call', subject: 'Cold Outreach', contact_name: 'Retail Exec', logged_by: bdUser._id, outcome: 'No Response' },
      ];
      for (const a of activities) {
        await Activity.create(a);
      }
      console.log(`  ✔ Created ${activities.length} activities`);
    } else {
      console.log(`\n[SEED] Activities already exist (${activityCount}). Skipping activity seed.`);
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
