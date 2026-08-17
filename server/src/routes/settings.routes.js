import express from 'express';
import { SystemSetting } from '../models/SystemSetting.js';
import { authenticate } from '../middleware/auth.js';
import { SECTIONS } from '../../../shared/constants.js';

const router = express.Router();

router.use(authenticate);

// GET /api/v1/settings
// Get all settings or a specific one by query ?key=
router.get('/', async (req, res, next) => {
  try {
    const { key } = req.query;
    
    if (key) {
      const setting = await SystemSetting.findOne({ key });
      return res.status(200).json({
        success: true,
        data: setting ? setting.value : null
      });
    }

    const settings = await SystemSetting.find();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: settingsMap
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/settings/:key
// Update or create a setting
router.put('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const userRole = req.user?.role;

    // Optional: we can restrict setting updates to Admins.
    // For exchange rate, MEALMATE or USER_MGMT write access might be needed.
    // We'll restrict to users who have write access to MealMate or User Management.
    const mealmateAccess = userRole?.permissions?.[SECTIONS.MEALMATE]?.access;
    const userMgmtAccess = userRole?.permissions?.[SECTIONS.USER_MGMT]?.access;
    
    const canWrite = 
      ["edit", "edit_rules", "full"].includes(mealmateAccess) || 
      ["edit", "edit_rules", "full"].includes(userMgmtAccess);

    if (!canWrite) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify system settings.'
      });
    }

    const updateData = { value };
    if (description) updateData.description = description;

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });
  } catch (err) {
    next(err);
  }
});

export default router;
