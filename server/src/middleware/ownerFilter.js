import { ACCESS_LEVELS } from '../../../shared/constants.js';

/**
 * ownerFilter(ownerField?)
 * Middleware factory that restricts queries to records owned by the current user
 * when their access level is EDIT_OWN or VIEW_OWN.
 *
 * @param {string} ownerField - The DB field name for the owner. Defaults to 'assigned_to'.
 *                              Pass 'owner' for Lead queries.
 */
export const ownerFilter = (ownerField = 'assigned_to') => (req, _res, next) => {
  req.rbacFilter = {};
  if (req.accessLevel === ACCESS_LEVELS.EDIT_OWN || req.accessLevel === ACCESS_LEVELS.VIEW_OWN) {
    req.rbacFilter[ownerField] = req.user._id;
  }
  next();
};
