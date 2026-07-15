import mongoose from 'mongoose';
import { ACCESS_LEVELS } from '../../../shared/constants.js';

const accessValues = Object.values(ACCESS_LEVELS);

/**
 * Creates a permission sub-field with an access enum.
 */
function permField() {
  return {
    access: {
      type: String,
      enum: accessValues,
      default: ACCESS_LEVELS.NONE,
    },
  };
}

const roleSchema = new mongoose.Schema(
  {
    role_name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
    },
    permissions: {
      inventory: permField(),
      pipeline: permField(),
      mealmate: permField(),
      social: permField(),
      business_gaps: permField(),
      user_mgmt: permField(),
    },
    is_system: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Role = mongoose.model('Role', roleSchema);

export default Role;
