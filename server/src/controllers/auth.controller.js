import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

function cookieOptions() {
  const isCrossDomain = env.CORS_ORIGIN && !env.CORS_ORIGIN.includes('localhost');
  const forceSecure = env.NODE_ENV === 'production' || isCrossDomain;
  return { httpOnly: true, secure: forceSecure, sameSite: forceSecure ? 'none' : 'lax', maxAge: 24 * 60 * 60 * 1000 };
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password').populate('roles');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Contact an admin.' });
    }

    const mergedRole = user.getMergedRole();
    const token = jwt.sign({ id: user._id, role_name: mergedRole?.role_name ?? 'No Role' }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

    res.cookie('token', token, cookieOptions());

    const profile = user.toObject();
    delete profile.password;
    profile.role = mergedRole;

    res.status(200).json({ success: true, message: 'Logged in successfully.', data: { user: profile, token } });
  } catch (err) { next(err); }
};

export const logout = (_req, res) => {
  res.clearCookie('token', cookieOptions());
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

export const getMe = (req, res) => {
  const profile = req.user.toObject();
  profile.role = req.user.getMergedRole();
  res.status(200).json({ success: true, data: { user: profile } });
};
