import { ACCESS_LEVELS, canRead } from "../../../shared/constants.js";

/**
 * Permission hierarchy.
 * Maps each access level to the set of levels it is sufficient to satisfy.
 * e.g. a user with FULL access satisfies any requirement below it.
 */
const SATISFIES = {
  [ACCESS_LEVELS.FULL]: new Set([
    ACCESS_LEVELS.FULL,
    ACCESS_LEVELS.EDIT,
    ACCESS_LEVELS.EDIT_OWN,
    ACCESS_LEVELS.EDIT_RULES,
    ACCESS_LEVELS.VIEW,
    ACCESS_LEVELS.VIEW_RESTRICTED,
    ACCESS_LEVELS.VIEW_OWN,
  ]),
  [ACCESS_LEVELS.EDIT]: new Set([
    ACCESS_LEVELS.EDIT,
    ACCESS_LEVELS.VIEW,
    ACCESS_LEVELS.VIEW_OWN,
  ]),
  [ACCESS_LEVELS.EDIT_OWN]: new Set([
    ACCESS_LEVELS.EDIT_OWN,
    ACCESS_LEVELS.VIEW,
    ACCESS_LEVELS.VIEW_OWN,
  ]),
  [ACCESS_LEVELS.EDIT_RULES]: new Set([
    ACCESS_LEVELS.EDIT_RULES,
    ACCESS_LEVELS.VIEW,
    ACCESS_LEVELS.VIEW_OWN,
  ]),
  [ACCESS_LEVELS.VIEW]: new Set([ACCESS_LEVELS.VIEW, ACCESS_LEVELS.VIEW_OWN]),
  [ACCESS_LEVELS.VIEW_RESTRICTED]: new Set([
    ACCESS_LEVELS.VIEW_RESTRICTED,
    ACCESS_LEVELS.VIEW_OWN,
  ]),
  [ACCESS_LEVELS.VIEW_OWN]: new Set([ACCESS_LEVELS.VIEW_OWN]),
  [ACCESS_LEVELS.NONE]: new Set(),
};

function levelSatisfies(userLevel, requiredLevel) {
  return SATISFIES[userLevel]?.has(requiredLevel) ?? false;
}

/**
 * authorize(section, requiredLevel)
 * Guards a route by checking the user's permission for the given section.
 * Attaches req.accessLevel for downstream use (e.g. ownerFilter).
 */
export function authorize(section, requiredLevel) {
  return (req, res, next) => {
    const userLevel =
      req.user?.role?.permissions?.[section]?.access ?? ACCESS_LEVELS.NONE;

    if (!levelSatisfies(userLevel, requiredLevel)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You need "${requiredLevel}" access to "${section}".`,
      });
    }

    req.accessLevel = userLevel;
    next();
  };
}

/**
 * requireAccess(section)
 * Alias for authorize(section, ACCESS_LEVELS.VIEW).
 * Guards routes that just need any level of access to a section.
 */
export function requireAccess(section) {
  return authorize(section, ACCESS_LEVELS.VIEW);
}
