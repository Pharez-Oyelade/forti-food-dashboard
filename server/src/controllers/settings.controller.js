import { SystemSetting } from '../models/SystemSetting.js';
import { SECTIONS } from '../../../shared/constants.js';

export const getSettings = async (req, res, next) => {
  try {
    const { key } = req.query;
    if (key) {
      const setting = await SystemSetting.findOne({ key });
      return res.json({ success: true, data: setting?.value ?? null });
    }
    const settings = await SystemSetting.find();
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    res.json({ success: true, data: settingsMap });
  } catch (err) { next(err); }
};

export const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const perms = req.user?.role?.permissions;
    const writeAccess = ['edit', 'edit_rules', 'full'];

    const canWrite = writeAccess.includes(perms?.[SECTIONS.MEALMATE]?.access) ||
      writeAccess.includes(perms?.[SECTIONS.USER_MGMT]?.access);

    if (!canWrite) {
      return res.status(403).json({ success: false, message: 'You do not have permission to modify system settings.' });
    }

    const updateData = { value, ...(description && { description }) };
    const setting = await SystemSetting.findOneAndUpdate({ key }, { $set: updateData }, { upsert: true, new: true, setDefaultsOnInsert: true });

    res.json({ success: true, message: 'Setting updated successfully', data: setting });
  } catch (err) { next(err); }
};
