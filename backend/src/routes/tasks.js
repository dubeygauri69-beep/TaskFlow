const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getMyTasks,
  getProjectTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// GET /api/tasks (my assigned tasks)
router.get('/', getMyTasks);

// Nested under projects:
// GET  /api/projects/:projectId/tasks
// POST /api/projects/:projectId/tasks
router.get('/project/:projectId', getProjectTasks);
router.post('/project/:projectId', createTask);
router.get('/project/:projectId/:id', getTask);
router.put('/project/:projectId/:id', updateTask);
router.delete('/project/:projectId/:id', protect, deleteTask);

module.exports = router;
