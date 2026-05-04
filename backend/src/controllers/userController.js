const User = require('../models/User');

// GET /api/users - get all users (admin only, for member search)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('name email role createdAt').sort('name');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id - get single user
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name email role createdAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUser };
