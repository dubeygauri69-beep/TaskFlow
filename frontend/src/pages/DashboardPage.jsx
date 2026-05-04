import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/Badge';
import Spinner from '../components/Spinner';
import { format, isValid } from 'date-fns';

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-primary-500' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-surface-hover rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getStats();
        setStats(res.data.data);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Spinner className="h-96" size="lg" />;
  if (error)   return <div className="card text-red-400 text-center py-12">{error}</div>;

  const { totalTasks, completedTasks, pendingTasks, overdueTasks, inProgressTasks, totalProjects, recentTasks } = stats;

  const statCards = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      color: 'bg-primary-600/20',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Completed',
      value: completedTasks,
      color: 'bg-green-900/30',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending',
      value: pendingTasks,
      color: 'bg-yellow-900/30',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      color: 'bg-red-900/30',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  if (isAdmin) {
    statCards.push({
      label: 'Projects',
      value: totalProjects,
      color: 'bg-purple-900/30',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
      ),
    });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Here is an overview of your work</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.slice(0, 4).map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatCard {...statCards[4]} />
          <div className="lg:col-span-2 card">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Task Completion Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Completed</span><span>{completedTasks}/{totalTasks}</span>
              </div>
              <ProgressBar value={completedTasks} max={totalTasks} color="bg-green-500" />
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 mt-3">
                <span>In Progress</span><span>{inProgressTasks}/{totalTasks}</span>
              </div>
              <ProgressBar value={inProgressTasks} max={totalTasks} color="bg-blue-500" />
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 mt-3">
                <span>Overdue</span><span>{overdueTasks}/{totalTasks}</span>
              </div>
              <ProgressBar value={overdueTasks} max={totalTasks} color="bg-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-200">Recent Tasks</h2>
          <Link to="/my-tasks" className="text-xs text-primary-400 hover:text-primary-300 font-medium">
            View all
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task._id} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{task.project?.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={task.status} isOverdue={task.isOverdue} />
                  {task.deadline && isValid(new Date(task.deadline)) && (
                    <span className="text-xs text-slate-500 hidden sm:block">
                      {format(new Date(task.deadline), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions for admin */}
      {isAdmin && (
        <div className="card">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Quick Actions</h2>
          <div className="flex gap-3">
            <Link to="/projects/new" className="btn-primary text-sm">
              Create Project
            </Link>
            <Link to="/projects" className="btn-secondary text-sm">
              View Projects
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
