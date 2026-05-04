const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// GET /api/projects
router.get('/', getProjects);

// POST /api/projects (admin only)
router.post('/', restrictTo('admin'), createProject);

// GET /api/projects/:id
router.get('/:id', getProject);

// PUT /api/projects/:id (admin only)
router.put('/:id', restrictTo('admin'), updateProject);

// DELETE /api/projects/:id (admin only)
router.delete('/:id', restrictTo('admin'), deleteProject);

// POST /api/projects/:id/members (admin only)
router.post('/:id/members', restrictTo('admin'), addMember);

// DELETE /api/projects/:id/members/:userId (admin only)
router.delete('/:id/members/:userId', restrictTo('admin'), removeMember);

module.exports = router;
