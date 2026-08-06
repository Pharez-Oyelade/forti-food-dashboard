import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import './Role.js';

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: [true, 'At least one role is required'],
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: hash the password if it has been modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

/**
 * Compare a plain-text candidate against the hashed password.
 * @param {string} candidate - The plain-text password to verify.
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Merge permissions from multiple populated roles.
 * Returns a virtual 'role' object that the frontend and middleware can use.
 */
userSchema.methods.getMergedRole = function () {
  if (!this.roles || this.roles.length === 0) return null;
  
  // If only one role, just return it for simplicity
  if (this.roles.length === 1 && this.roles[0].permissions) {
    return this.roles[0];
  }

  const hierarchy = [
    'none',
    'view_restricted',
    'view_own',
    'view',
    'edit_own',
    'edit_rules',
    'edit',
    'full'
  ];

  const mergedPermissions = {};

  for (const role of this.roles) {
    if (!role.permissions) continue;
    
    for (const [section, perm] of Object.entries(role.permissions)) {
      const currentAccess = mergedPermissions[section]?.access || 'none';
      const newAccess = perm.access || 'none';
      
      const currentIdx = hierarchy.indexOf(currentAccess);
      const newIdx = hierarchy.indexOf(newAccess);
      
      if (newIdx > currentIdx) {
        mergedPermissions[section] = { access: newAccess };
      }
    }
  }

  return {
    _id: this.roles[0]._id, // Use primary role ID
    role_name: this.roles.map(r => r.role_name).join(' + '),
    permissions: mergedPermissions
  };
};

const User = mongoose.model('User', userSchema);

export default User;
