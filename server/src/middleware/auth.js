import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

function extractToken(req) {
  if (req.cookies?.token) return req.cookies.token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

export async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id).populate('roles');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact an admin.' });
    }

    // Attach merged role so downstream middleware can read req.user.role.permissions
    user.role = user.getMergedRole();
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
    }
    next(err);
  }
}
