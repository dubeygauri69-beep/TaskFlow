import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectApi, taskApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge, RoleBadge } from '../components/Badge';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

// ---- Task Form Modal ----
function TaskFormModal({ isOpen, onClose, projectId, projectMembers, task, onSaved }) {
  const { user, isAdmin } = useAuth();
  const isEditing = !!task;
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    assignedTo: '',
    status: 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (task) {
      setForm({
        title:       task.title || '',
        description: task.description || '',
        priority:    task.priority || 'medium',
        deadline:    task.deadline ? task.deadline.slice(0, 10) : '',
        assignedTo:  task.assignedTo?._id || task.assignedTo || '',
        status:      task.status || 'pending',
      });
    } else {
      setForm({ title: '', description: '', priority: 'medium', deadline: '', assignedTo: '', status: 'pending' });
    }
    setErrors({});
  }, [task, isOpen]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim() || form.title.length < 2) errs.title = 'Title must be at least 2 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.deadline)   delete payload.deadline;

      if (isEditing) {
        await taskApi.update(projectId, task._id, payload);
        toast.success('Task updated!');
      } else {
        await taskApi.create(projectId, payload);
        toast.success('Task created!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  const canEditAll = isAdmin || !isEditing;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'Create Task'}>
      <form onSubmit={handleSubmit} noValidate id="task-form">
        <div className="space-y-4">
          <div>
            <label htmlFor="task-title" className="label">Title <span className="text-red-400">*</span></label>
            <input
              id="task-title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              disabled={!canEditAll && isEditing}
              className={`input ${errors.title ? 'border-red-500' : ''} disabled:opacity-50`}
              placeholder="Task title"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="task-description" className="label">Description</label>
            <textarea
              id="task-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={!canEditAll && isEditing}
              rows={3}
              className="input resize-none disabled:opacity-50"
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-status" className="label">Status</label>
              <select id="task-status" name="status" value={form.status} onChange={handleChange} className="input">
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label htmlFor="task-priority" className="label">Priority</label>
              <select id="task-priority" name="priority" value={form.priority} onChange={handleChange} disabled={!canEditAll && isEditing} className="input disabled:opacity-50">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-deadline" className="label">Deadline</label>
            <input
              id="task-deadline"
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              disabled={!canEditAll && isEditing}
              className="input disabled:opacity-50"
            />
          </div>

          {canEditAll && (
            <div>
              <label htmlFor="task-assignedTo" className="label">Assign To</label>
              <select id="task-assignedTo" name="assignedTo" value={form.assignedTo} onChange={handleChange} className="input">
                <option value="">Unassigned</option>
                {projectMembers.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" id="task-submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEditing ? 'Saving...' : 'Creating...'}</> : isEditing ? 'Save Changes' : 'Create Task'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ---- Add Member Modal ----
function AddMemberModal({ isOpen, onClose, projectId, onAdded }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isOpen) setEmail(''); }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await projectApi.addMember(projectId, email);
      toast.success('Member added!');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Member">
      <form onSubmit={handleSubmit} id="add-member-form">
        <div className="space-y-4">
          <div>
            <label htmlFor="member-email" className="label">Member Email</label>
            <input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="member@example.com"
              required
            />
            <p className="text-xs text-slate-500 mt-1">The user must already have an account in TaskFlow.</p>
          </div>
          <div className="flex gap-3">
            <button type="submit" id="add-member-submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adding...</> : 'Add Member'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ---- Main Project Detail Page ----
export default function ProjectDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { isAdmin, user } = useAuth();

  const [project, setProject]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');

  const [taskModalOpen, setTaskModalOpen]   = useState(false);
  const [editingTask, setEditingTask]       = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const loadProject = useCallback(async () => {
    try {
      const res = await projectApi.getOne(id);
      setProject(res.data.data);
    } catch {
      toast.error('Failed to load project.');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadProject(); }, [loadProject]);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    setDeletingTaskId(taskId);
    try {
      await taskApi.remove(id, taskId);
      toast.success('Task deleted.');
      loadProject();
    } catch {
      toast.error('Failed to delete task.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await projectApi.removeMember(id, memberId);
      toast.success('Member removed.');
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this entire project and all its tasks?')) return;
    try {
      await projectApi.remove(id);
      toast.success('Project deleted.');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project.');
    }
  };

  if (loading) return <Spinner className="h-96" size="lg" />;
  if (!project) return null;

  const isOwner = project.owner._id === user._id || project.owner._id?.toString() === user._id?.toString();
  const tasks   = project.tasks || [];
  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/projects" className="text-slate-500 hover:text-slate-300 text-sm">Projects</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 text-sm">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
          {project.description && (
            <p className="text-slate-400 text-sm mt-1">{project.description}</p>
          )}
        </div>
        {isOwner && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              id="add-member-btn"
              onClick={() => setMemberModalOpen(true)}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Member
            </button>
            <button
              id="delete-project-btn"
              onClick={handleDeleteProject}
              className="btn-danger text-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-surface-card rounded-lg p-1 border border-surface-border">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filter === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(isAdmin || isOwner) && (
              <button
                id="add-task-btn"
                onClick={() => { setEditingTask(null); setTaskModalOpen(true); }}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-500">No tasks {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="card hover:border-primary-600/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-slate-200 text-sm">{task.title}</h3>
                        <StatusBadge status={task.status} isOverdue={task.isOverdue} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {task.assignedTo && (
                          <span className="text-xs text-slate-500">
                            Assigned to <span className="text-slate-300">{task.assignedTo.name}</span>
                          </span>
                        )}
                        {task.deadline && isValid(new Date(task.deadline)) && (
                          <span className={`text-xs ${task.isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                            Due {format(new Date(task.deadline), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingTask(task); setTaskModalOpen(true); }}
                        className="btn-ghost text-xs"
                        title="Edit task"
                      >
                        Edit
                      </button>
                      {(isAdmin || isOwner) && (
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          disabled={deletingTaskId === task._id}
                          className="btn-ghost text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          title="Delete task"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Team Members</h2>
            <div className="space-y-3">
              {project.members.map((m) => (
                <div key={m._id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-slate-200 font-medium leading-tight">
                        {m.name}
                        {m._id === project.owner._id && (
                          <span className="ml-1.5 text-xs text-primary-400">(Owner)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[140px]">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <RoleBadge role={m.role} />
                    {isOwner && m._id !== project.owner._id && (
                      <button
                        onClick={() => handleRemoveMember(m._id)}
                        className="text-slate-600 hover:text-red-400 transition-colors ml-1"
                        title="Remove member"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project stats */}
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Project Stats</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Total Tasks', value: tasks.length },
                { label: 'Completed',   value: tasks.filter((t) => t.status === 'completed').length },
                { label: 'In Progress', value: tasks.filter((t) => t.status === 'in-progress').length },
                { label: 'Pending',     value: tasks.filter((t) => t.status === 'pending').length },
                { label: 'Overdue',     value: tasks.filter((t) => t.isOverdue).length },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        projectId={id}
        projectMembers={project.members}
        task={editingTask}
        onSaved={loadProject}
      />
      <AddMemberModal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        projectId={id}
        onAdded={loadProject}
      />
    </div>
  );
}
