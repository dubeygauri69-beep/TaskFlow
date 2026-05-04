const { body } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const validate = require('../middleware/validate');

// Validation rules
const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ min: 2, max: 150 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date'),
  body('assignedTo').optional().isMongoId().withMessage('Assigned user must be a valid ID'),
];

// Helper: check if user is a project member
const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404, project: null };
  const isMember = project.members.some((m) => m.toString() === userId.toString());
  const isOwner = project.owner.toString() === userId.toString();
  if (!isMember && !isOwner) return { error: 'Access denied', status: 403, project: null };
  return { error: null, status: 200, project };
};

// GET /api/tasks - get all tasks for current user (across projects)
const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    const enriched = tasks.map((t) => ({
      ...t.toJSON(),
      isOverdue: t.isOverdue,
    }));

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:projectId/tasks - list tasks for a project
const getProjectTasks = async (req, res, next) => {
  try {
    const { error, status } = await checkProjectAccess(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const { status: taskStatus, priority, assignedTo } = req.query;
    const filter = { project: req.params.projectId };
    if (taskStatus) filter.status = taskStatus;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    const enriched = tasks.map((t) => ({ ...t.toJSON(), isOverdue: t.isOverdue }));
    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/tasks - create task (admin/owner only)
const createTask = [
  ...taskValidation,
  validate,
  async (req, res, next) => {
    try {
      const { error, status, project } = await checkProjectAccess(req.params.projectId, req.user._id);
      if (error) return res.status(status).json({ success: false, message: error });

      if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only project owners or admins can create tasks.' });
      }

      // Validate assigned user is a project member
      if (req.body.assignedTo) {
        const isProjectMember = project.members.some(
          (m) => m.toString() === req.body.assignedTo
        );
        if (!isProjectMember) {
          return res.status(400).json({ success: false, message: 'Assigned user is not a project member.' });
        }
      }

      const task = await Task.create({
        ...req.body,
        project: req.params.projectId,
        createdBy: req.user._id,
      });

      await task.populate('assignedTo', 'name email');
      await task.populate('createdBy', 'name email');

      res.status(201).json({ success: true, data: { ...task.toJSON(), isOverdue: task.isOverdue } });
    } catch (err) {
      next(err);
    }
  },
];

// GET /api/projects/:projectId/tasks/:id - single task
const getTask = async (req, res, next) => {
  try {
    const { error, status } = await checkProjectAccess(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const task = await Task.findOne({ _id: req.params.id, project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    res.status(200).json({ success: true, data: { ...task.toJSON(), isOverdue: task.isOverdue } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId/tasks/:id - update task
const updateTask = [
  body('title').optional().trim().notEmpty().isLength({ min: 2, max: 150 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('deadline').optional().isISO8601(),
  body('assignedTo').optional().isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const { error, status, project } = await checkProjectAccess(req.params.projectId, req.user._id);
      if (error) return res.status(status).json({ success: false, message: error });

      const task = await Task.findOne({ _id: req.params.id, project: req.params.projectId });
      if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

      const isOwner = project.owner.toString() === req.user._id.toString();
      const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

      // Members can only update status of their own tasks
      if (!isOwner && req.user.role !== 'admin') {
        if (!isAssignee) {
          return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you.' });
        }
        // Instead of throwing an error, we just strip out any fields members aren't allowed to edit
        if (req.body.status !== undefined) {
          req.body = { status: req.body.status };
        } else {
          req.body = {};
        }
      }

      // Validate assigned user is member if changing assignedTo
      if (req.body.assignedTo && project) {
        const isProjectMember = project.members.some((m) => m.toString() === req.body.assignedTo);
        if (!isProjectMember) {
          return res.status(400).json({ success: false, message: 'Assigned user is not a project member.' });
        }
      }

      Object.assign(task, req.body);
      await task.save();
      await task.populate('assignedTo', 'name email');
      await task.populate('createdBy', 'name email');

      res.status(200).json({ success: true, data: { ...task.toJSON(), isOverdue: task.isOverdue } });
    } catch (err) {
      next(err);
    }
  },
];

// DELETE /api/projects/:projectId/tasks/:id - delete task (owner/admin)
const deleteTask = async (req, res, next) => {
  try {
    const { error, status, project } = await checkProjectAccess(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project owners or admins can delete tasks.' });
    }

    const task = await Task.findOneAndDelete({ _id: req.params.id, project: req.params.projectId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyTasks, getProjectTasks, createTask, getTask, updateTask, deleteTask };
