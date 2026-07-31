import express from 'express';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(SECTIONS.USER_MGMT, ACCESS_LEVELS.FULL));

// Get all users
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().populate('role').sort('-createdAt');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// Get all roles
router.get('/roles', async (req, res, next) => {
  try {
    const roles = await Role.find();
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
});

// Create user
router.post('/', async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    const populatedUser = await User.findById(user._id).populate('role');
    res.status(201).json({ success: true, data: populatedUser });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', async (req, res, next) => {
  try {
    // If password is not provided or empty, don't update it
    if (req.body.password === '' || req.body.password === undefined) {
      delete req.body.password;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    Object.assign(user, req.body);
    await user.save();
    
    const populatedUser = await User.findById(user._id).populate('role');
    res.json({ success: true, data: populatedUser });
  } catch (error) {
    next(error);
  }
});

export default router;
