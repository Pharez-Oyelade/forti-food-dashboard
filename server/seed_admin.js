import mongoose from "mongoose";
import env from "./src/config/env.js";
import Role from "./src/models/Role.js";
import User from "./src/models/User.js";
import { ROLE_NAMES, ACCESS_LEVELS } from "../shared/constants.js";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function seedAdmin() {
  try {
    console.log("Connecting to Database:", env.MONGO_URI);
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Create or Find Founder/Admin Role
    let adminRole = await Role.findOne({ role_name: ROLE_NAMES.FOUNDER_ADMIN });

    if (!adminRole) {
      console.log("Admin role not found, creating it...");
      adminRole = new Role({
        role_name: ROLE_NAMES.FOUNDER_ADMIN,
        permissions: {
          inventory: { access: ACCESS_LEVELS.FULL },
          pipeline: { access: ACCESS_LEVELS.FULL },
          mealmate: { access: ACCESS_LEVELS.FULL },
          social: { access: ACCESS_LEVELS.FULL },
          business_gaps: { access: ACCESS_LEVELS.FULL },
          user_mgmt: { access: ACCESS_LEVELS.FULL },
        },
        is_system: true,
      });
      await adminRole.save();
      console.log("Admin role created:", adminRole._id);
    } else {
      console.log("Admin role already exists:", adminRole._id);
    }

    // 2. Read Admin details from Environment
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "Forti Admin";

    if (!adminEmail || !adminPassword) {
      console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env file.");
      process.exit(1);
    }

    // 3. Create or Find Admin User
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.log("Admin user not found, creating it...");
      adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        roles: [adminRole._id],
        is_active: true,
      });
      await adminUser.save();
      console.log("Admin user created successfully!");
    } else {
      console.log("Admin user already exists. Updating roles if needed...");
      if (!adminUser.roles.includes(adminRole._id)) {
        adminUser.roles.push(adminRole._id);
        await adminUser.save();
        console.log("Added Admin role to existing user.");
      } else {
        console.log("User already has Admin role.");
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
