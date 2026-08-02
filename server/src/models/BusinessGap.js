import mongoose from "mongoose";

const businessGapSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Gap title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    severity: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN",
    },
    department_tags: [
      {
        type: String,
        enum: ["Sales", "Inventory", "Programs", "Marketing", "Finance", "Operations", "General"],
      },
    ],
    owner: {
      type: String,
      trim: true,
      default: "Unassigned",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resolved_at: {
      type: Date,
    },
    is_automated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const BusinessGap = mongoose.model("BusinessGap", businessGapSchema);
