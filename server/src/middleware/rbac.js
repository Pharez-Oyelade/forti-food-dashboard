import { ACCESS_LEVELS, canRead } from '../../../shared/constants.js';

/**
 * Permission hierarchy — maps each level to the set of levels it satisfies.
 * If a user has level X, they can fulfil any requirement in SATISFIES[X].
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
  [ACCESS_LEVELS.VIEW]: new Set([
    ACCESS_LEVELS.VIEW,
    ACCESS_LEVELS.VIEW_OWN,
  ]),
  [ACCESS_LEVELS.VIEW_RESTRICTED]: new Set([
    ACCESS_LEVELS.VIEW_RESTRICTED,
    ACCESS_LEVELS.VIEW_OWN,
  ]),
  [ACCESS_LEVELS.VIEW_OWN]: new Set([
    ACCESS_LEVELS.VIEW_OWN,
  ]),
  [ACCESS_LEVELS.NONE]: new Set(),
};

/**
 * Check whether `userLevel` satisfies `requiredLevel`.
 * @param {string} userLevel - The level the user actually has.
 * @param {string} requiredLevel - The minimum level required.
 * @returns {boolean}
 */
function levelSatisfies(userLevel, requiredLevel) {
  const allowed = SATISFIES[userLevel];
  return allowed ? allowed.has(requiredLevel) : false;
}

/**
 * Authorise middleware factory.
 * Checks that the authenticated user's permission for `section`
 * satisfies `requiredLevel`.
 *
 * @param {string} section - The dashboard section (e.g. 'inventory').
 * @param {string} requiredLevel - The minimum access level needed.
 */
export function authorize(section, requiredLevel) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !role.permissions) {
      return res.status(403).json({
        success: false,
        message: 'Role or permissions not found on user.',
      });
    }

    const sectionPerms = role.permissions[section];

    if (!sectionPerms) {
      return res.status(403).json({
        success: false,
        message: `Unknown section: "${section}".`,
      });
    }

    const userLevel = sectionPerms.access || ACCESS_LEVELS.NONE;

    if (!levelSatisfies(userLevel, requiredLevel)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. "${section}" requires "${requiredLevel}" access, but your role "${role.role_name}" has "${userLevel}".`,
      });
    }

    // Attach the resolved level so downstream handlers can branch on it
    req.accessLevel = userLevel;
    next();
  };
}

/**
 * Simpler guard — just ensures the user has *any* access (not 'none')
 * to the given section.
 *
 * @param {string} section - The dashboard section to check.
 */
export function requireAccess(section) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !role.permissions) {
      return res.status(403).json({
        success: false,
        message: 'Role or permissions not found on user.',
      });
    }

    const userLevel = role.permissions[section]?.access || ACCESS_LEVELS.NONE;

    if (!canRead(userLevel)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You have no access to "${section}".`,
      });
    }

    req.accessLevel = userLevel;
    next();
  };
}
