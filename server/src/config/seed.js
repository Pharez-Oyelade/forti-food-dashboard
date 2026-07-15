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

    if (existingAdmin) {
      // Update role association (password stays unchanged)
      existingAdmin.role = adminRole._id;
      existingAdmin.name = env.ADMIN_NAME;
      existingAdmin.is_active = true;
      await existingAdmin.save();
      console.log(`  ✔ Admin updated: ${existingAdmin.email}`);
    } else {
      const admin = await User.create({
        name: env.ADMIN_NAME,
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
        role: adminRole._id,
        is_active: true,
      });
      console.log(`  ✔ Admin created: ${admin.email}`);
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
