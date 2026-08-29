import { FIELD_RESTRICTIONS, isRestricted } from '../../../shared/constants.js';

/**
 * fieldFilter(section)
 * Response middleware that strips restricted fields from JSON responses
 * when the user's access level for the section is 'view_restricted'.
 */
export const fieldFilter = (section) => (req, res, next) => {
  if (!isRestricted(req.accessLevel)) return next();

  const restrictedFields = FIELD_RESTRICTIONS[section] ?? [];
  const originalJson = res.json.bind(res);

  const strip = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const plain = typeof obj.toObject === 'function' ? obj.toObject() : { ...obj };
    for (const field of restrictedFields) delete plain[field];
    return plain;
  };

  res.json = (data) => {
    if (data?.success && data?.data) {
      data.data = Array.isArray(data.data) ? data.data.map(strip) : strip(data.data);
    }
    return originalJson(data);
  };

  next();
};
