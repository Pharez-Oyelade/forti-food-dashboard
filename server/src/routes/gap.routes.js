import express from "express";
import { BusinessGap } from "../models/BusinessGap.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";
import { ACCESS_LEVELS, SECTIONS } from "../../../shared/constants.js";

const router = express.Router();

router.use(authenticate);

// Get all gaps
router.get("/", authorize(SECTIONS.BUSINESS_GAPS, ACCESS_LEVELS.VIEW), async (req, res, next) => {
  try {
    const gaps = await BusinessGap.find()
      .populate("created_by", "name email")
      .sort("-createdAt");
    res.json({ success: true, data: gaps });
  } catch (error) {
    next(error);
  }
});

// Create new gap
router.post("/", authorize(SECTIONS.BUSINESS_GAPS, ACCESS_LEVELS.EDIT), async (req, res, next) => {
  try {
    const gapData = {
      ...req.body,
      created_by: req.user._id,
    };
    
    if (gapData.status === "RESOLVED") {
      gapData.resolved_at = new Date();
    }

    const gap = await BusinessGap.create(gapData);
    res.status(201).json({ success: true, data: gap });
  } catch (error) {
    next(error);
  }
});

// Update gap
router.put("/:id", authorize(SECTIONS.BUSINESS_GAPS, ACCESS_LEVELS.EDIT), async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    // Automatically set resolved_at if status changes to RESOLVED
    if (updateData.status === "RESOLVED") {
      updateData.resolved_at = new Date();
    } else if (updateData.status && updateData.status !== "RESOLVED") {
      updateData.resolved_at = null;
    }

    const gap = await BusinessGap.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("created_by", "name email");

    if (!gap) {
      return res.status(404).json({ success: false, message: "Gap not found" });
    }

    res.json({ success: true, data: gap });
  } catch (error) {
    next(error);
  }
});

// Delete gap
router.delete("/:id", authorize(SECTIONS.BUSINESS_GAPS, ACCESS_LEVELS.DELETE), async (req, res, next) => {
  try {
    const gap = await BusinessGap.findByIdAndDelete(req.params.id);
    if (!gap) {
      return res.status(404).json({ success: false, message: "Gap not found" });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
