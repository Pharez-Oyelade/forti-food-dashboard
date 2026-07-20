import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import env from "./config/env.js";
import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

// ── Route imports ──
import authRoutes from "./routes/auth.routes.js";
import dealRoutes from "./routes/deal.routes.js";
import productRoutes from "./routes/product.routes.js";
import reportRoutes from "./routes/report.routes.js";
import bdMetricsRoutes from "./routes/bd-metrics.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import grantRoutes from "./routes/grant.routes.js";
import schoolRoutes from "./routes/school.routes.js";

// ── Initialise Express ──
const app = express();
app.set("trust proxy", 1);

// ── Global Middleware ──
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// ── Health check ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/deals", dealRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/metrics", bdMetricsRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/grants", grantRoutes);
app.use("/api/v1/schools", schoolRoutes);

// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Server ──
async function start() {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`\nForti Dashboard API running on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`CORS origin: ${env.CORS_ORIGIN}\n`);
  });
}

start();

export default app;
