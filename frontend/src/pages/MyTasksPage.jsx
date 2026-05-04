import { useEffect, useState } from 'react';
import { taskApi } from '../api/services';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { useAuth } from '../context/AuthContext';

function UpdateStatusModal({ isOpen, onClose, task, onUpdated }) {
  const [status, setStatus]   = useState(task?.status || 'pending');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (task) setStatus(task.status); }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await taskApi.update(task.project._id || task.project, task._id, { status });
      toast.success('Status updated!');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Task Status" maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} id="update-status-form">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-3">{task?.title}</p>
            <label htmlFor="update-status-select" className="label">New Status</label>
            <select
              id="update-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" id="update-status-submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Update Status'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function MyTasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);

  const loadTasks = async () => {
    try {
      const res = await taskApi.getMyTasks();
      setTasks(res.data.data);
    } catch {
      toast.error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const filteredTasks =
    filter === 'all'
      ? tasks
      : filter === 'overdue'
      ? tasks.filter((t) => t.isOverdue)
      : tasks.filter((t) => t.status === filter);

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Overdue', value: 'overdue' },
  ];

  if (loading) return <Spinner className="h-96" size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Tasks</h1>
        <p className="text-slate-400 text-sm mt-1">All tasks assigned to you across projects</p>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1 bg-surface-card rounded-lg p-1 border border-surface-border w-fit">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === opt.value ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {opt.label}
            {opt.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({opt.value === 'overdue'
                  ? tasks.filter((t) => t.isOverdue).length
                  : tasks.filter((t) => t.status === opt.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="card text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-500">No tasks{filter !== 'all' ? ` with filter "${filter}"` : ' assigned to you'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div key={task._id} className="card hover:border-primary-600/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-slate-200">{task.title}</h3>
                    <StatusBadge status={task.status} isOverdue={task.isOverdue} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                  {task.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-medium text-slate-400">{task.project?.name}</span>
                    {task.deadline && isValid(new Date(task.deadline)) && (
                      <span className={task.isOverdue ? 'text-red-400' : ''}>
                        Due {format(new Date(task.deadline), 'MMM d, yyyy')}
                      </span>
                    )}
                    <span>Created {format(new Date(task.createdAt), 'MMM d')}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedTask(task); setModalOpen(true); }}
                  className="btn-ghost text-xs flex-shrink-0"
                >
                  Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UpdateStatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        task={selectedTask}
        onUpdated={loadTasks}
      />
    </div>
  );
}
