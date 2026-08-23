import { FIELD_RESTRICTIONS, isRestricted } from "../../../shared/constants.js";

/**
 * Middleware to strip restricted fields from the response
 * if the user has a 'view_restricted' access level for the current section.
 *
 */
export const fieldFilter = (section) => (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (isRestricted(req.accessLevel)) {
      const restrictedFields = FIELD_RESTRICTIONS[section] || [];

      const stripFields = (obj) => {
        if (!obj || typeof obj !== "object") return obj;

        // Handle Mongoose documents
        if (typeof obj.toObject === "function") {
          obj = obj.toObject();
        }

        const newObj = { ...obj };
        for (const field of restrictedFields) {
          delete newObj[field];
        }
        return newObj;
      };

      if (data && data.success && data.data) {
        if (Array.isArray(data.data)) {
          data.data = data.data.map(stripFields);
        } else {
          data.data = stripFields(data.data);
        }
      } else if (data && !data.success && data.data === undefined) {
      } else {
        // Fallback if data isn't wrapped in { success, data }
        if (Array.isArray(data)) {
          data = data.map(stripFields);
        } else {
          data = stripFields(data);
        }
      }
    }

    // Call the original res.json
    return originalJson.call(this, data);
  };

  next();
};
