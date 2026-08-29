import User from '../models/User.js';
import Role from '../models/Role.js';

const toUserDTO = (user) => {
  const obj = user.toObject();
  obj.role = user.getMergedRole();
  return obj;
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate('roles').sort('-createdAt');
    res.json({ success: true, data: users.map(toUserDTO) });
  } catch (err) { next(err); }
};

export const listRoles = async (req, res, next) => {
  try {
    const roles = await Role.find();
    res.json({ success: true, data: roles });
  } catch (err) { next(err); }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    const populated = await User.findById(user._id).populate('roles');
    res.status(201).json({ success: true, data: toUserDTO(populated) });
  } catch (err) { next(err); }
};

export const updateUser = async (req, res, next) => {
  try {
    if (!req.body.password) delete req.body.password;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    Object.assign(user, req.body);
    await user.save();

    const populated = await User.findById(user._id).populate('roles');
    res.json({ success: true, data: toUserDTO(populated) });
  } catch (err) { next(err); }
};
