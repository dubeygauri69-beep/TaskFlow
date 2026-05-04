const express = require('express');
const router = express.Router();
const { getUsers, getUser } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/users (admin only)
router.get('/', protect, restrictTo('admin'), getUsers);

// GET /api/users/:id
router.get('/:id', protect, getUser);

module.exports = router;
