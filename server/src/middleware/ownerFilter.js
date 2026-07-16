import { ACCESS_LEVELS } from '../../../shared/constants.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware to enforce 'edit_own' restrictions.
 * 
 * - For GET (list): It modifies req.query or a new req.ownerFilter object to ensure only owned records are returned.
 *   Alternatively, it can just attach a filter to `req.rbacFilter`.
 * 
 * - For PUT/DELETE/GET(id): The actual route handler must use `req.rbacFilter` when querying the DB.
 */
export const ownerFilter = (req, res, next) => {
  req.rbacFilter = {};

  if (req.accessLevel === ACCESS_LEVELS.EDIT_OWN || req.accessLevel === ACCESS_LEVELS.VIEW_OWN) {
    req.rbacFilter.assigned_to = req.user._id;
  }

  next();
};
