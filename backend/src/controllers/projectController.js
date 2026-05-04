const { body, param } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const validate = require('../middleware/validate');

// Validation rules
const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
];

// GET /api/projects - list projects accessible to the current user
const getProjects = async (req, res, next) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      // Admins see projects they own
      projects = await Project.find({ owner: req.user._id })
        .populate('owner', 'name email role')
        .populate('members', 'name email role')
        .sort('-createdAt');
    } else {
      // Members see projects they are part of
      projects = await Project.find({ members: req.user._id })
        .populate('owner', 'name email role')
        .populate('members', 'name email role')
        .sort('-createdAt');
    }

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (proj) => {
        const taskCount = await Task.countDocuments({ project: proj._id });
        const completedCount = await Task.countDocuments({ project: proj._id, status: 'completed' });
        return { ...proj.toJSON(), taskCount, completedCount };
      })
    );

    res.status(200).json({ success: true, data: projectsWithCounts });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects - create project (admin only)
const createProject = [
  ...projectValidation,
  validate,
  async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const project = await Project.create({
        name,
        description,
        owner: req.user._id,
        members: [req.user._id],
      });
      await project.populate('owner', 'name email role');
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },
];

// GET /api/projects/:id - get single project
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check access
    const isMember = project.members.some((m) => m._id.toString() === req.user._id.toString());
    const isOwner = project.owner._id.toString() === req.user._id.toString();
    if (!isMember && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: { ...project.toJSON(), tasks } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id - update project (owner only)
const updateProject = [
  ...projectValidation,
  validate,
  async (req, res, next) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

      if (project.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only the project owner can update it.' });
      }

      const { name, description, status } = req.body;
      if (name) project.name = name;
      if (description !== undefined) project.description = description;
      if (status) project.status = status;

      await project.save();
      await project.populate('owner', 'name email role');
      await project.populate('members', 'name email role');

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },
];

// DELETE /api/projects/:id - delete project (owner only)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete it.' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.status(200).json({ success: true, message: 'Project and its tasks deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/members - add member (owner only)
const addMember = [
  body('email').isEmail().withMessage('Valid email is required'),
  validate,
  async (req, res, next) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

      if (project.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only the project owner can add members.' });
      }

      const userToAdd = await User.findOne({ email: req.body.email });
      if (!userToAdd) return res.status(404).json({ success: false, message: 'No user found with that email.' });

      if (project.members.includes(userToAdd._id)) {
        return res.status(409).json({ success: false, message: 'User is already a member of this project.' });
      }

      project.members.push(userToAdd._id);
      await project.save();
      await project.populate('members', 'name email role');

      res.status(200).json({ success: true, message: 'Member added successfully.', data: project.members });
    } catch (error) {
      next(error);
    }
  },
];

// DELETE /api/projects/:id/members/:userId - remove member (owner only)
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can remove members.' });
    }

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner.' });
    }

    project.members = project.members.filter((m) => m.toString() !== req.params.userId);
    await project.save();

    res.status(200).json({ success: true, message: 'Member removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
