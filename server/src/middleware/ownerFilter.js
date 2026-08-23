import { ACCESS_LEVELS } from "../../../shared/constants.js";
import { AppError } from "./errorHandler.js";

/**
 * Middleware to enforce 'edit_own' restrictions.
 *
 */
export const ownerFilter = (req, res, next) => {
  req.rbacFilter = {};

  if (
    req.accessLevel === ACCESS_LEVELS.EDIT_OWN ||
    req.accessLevel === ACCESS_LEVELS.VIEW_OWN
  ) {
    req.rbacFilter.assigned_to = req.user._id;
  }

  next();
};
