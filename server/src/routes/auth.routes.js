import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { loginSchema } from '../validators/auth.validators.js';

const router = Router();

/** Cookie options shared between login/logout */
function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
}

/**
 * POST /api/v1/auth/login
 * Authenticate user, set JWT cookie, return profile.
 */
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password included, populate role
    const user = await User.findOne({ email })
      .select('+password')
      .populate('role');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Contact an admin.',
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, role_name: user.role.role_name },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Set httpOnly cookie
    res.cookie('token', token, cookieOptions());

    // Return user without password
    const profile = user.toObject();
    delete profile.password;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: { user: profile },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/logout
 * Clear the auth cookie.
 */
router.post('/logout', (_req, res) => {
  res.clearCookie('token', cookieOptions());

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * GET /api/v1/auth/me
 * Return the currently authenticated user's profile.
 */
router.get('/me', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

export default router;
