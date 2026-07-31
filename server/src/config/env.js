import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, "..", "..", "..", ".env") });

const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/forti_dashboard",

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  // Default Admin (seeder)
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@fortifoods.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "changeme123",
  ADMIN_NAME: process.env.ADMIN_NAME || "Forti Admin",
};

export default env;
