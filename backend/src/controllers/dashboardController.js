const Task = require('../models/Task');
const Project = require('../models/Project');

// GET /api/dashboard - dashboard stats for current user
const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    let taskFilter = {};
    let projectFilter = {};

    if (req.user.role === 'admin') {
      // Admin sees stats for all projects they own
      const ownedProjects = await Project.find({ owner: req.user._id }).select('_id');
      const projectIds = ownedProjects.map((p) => p._id);
      taskFilter = { project: { $in: projectIds } };
      projectFilter = { owner: req.user._id };
    } else {
      // Member sees their assigned tasks
      taskFilter = { assignedTo: req.user._id };
      projectFilter = { members: req.user._id };
    }

    const [totalTasks, completedTasks, inProgressTasks, pendingTasks, overdueTasks, totalProjects, recentTasks] =
      await Promise.all([
        Task.countDocuments(taskFilter),
        Task.countDocuments({ ...taskFilter, status: 'completed' }),
        Task.countDocuments({ ...taskFilter, status: 'in-progress' }),
        Task.countDocuments({ ...taskFilter, status: 'pending' }),
        Task.countDocuments({
          ...taskFilter,
          status: { $ne: 'completed' },
          deadline: { $lt: now },
        }),
        Project.countDocuments(projectFilter),
        Task.find(taskFilter)
          .populate('project', 'name')
          .populate('assignedTo', 'name email')
          .sort('-createdAt')
          .limit(5),
      ]);

    const recentEnriched = recentTasks.map((t) => ({ ...t.toJSON(), isOverdue: t.isOverdue }));

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks,
        totalProjects,
        recentTasks: recentEnriched,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
