import { FIELD_RESTRICTIONS, isRestricted } from '../../../shared/constants.js';

/**
 * Middleware to strip restricted fields from the response
 * if the user has a 'view_restricted' access level for the current section.
 *
 * This works by intercepting res.json and removing keys.
 */
export const fieldFilter = (section) => (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (isRestricted(req.accessLevel)) {
      const restrictedFields = FIELD_RESTRICTIONS[section] || [];
      
      const stripFields = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        // Handle Mongoose documents
        if (typeof obj.toObject === 'function') {
          obj = obj.toObject();
        }

        const newObj = { ...obj };
        for (const field of restrictedFields) {
          delete newObj[field];
        }
        return newObj;
      };

      // Ensure we only strip fields inside the 'data' payload of our standardized response format
      if (data && data.success && data.data) {
        if (Array.isArray(data.data)) {
          data.data = data.data.map(stripFields);
        } else {
          data.data = stripFields(data.data);
        }
      } else if (data && !data.success && data.data === undefined) {
         // It's an error response or doesn't match our format, skip stripping
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
