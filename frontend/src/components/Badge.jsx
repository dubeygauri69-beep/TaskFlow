export function StatusBadge({ status, isOverdue }) {
  if (isOverdue && status !== 'completed') {
    return <span className="badge-overdue">Overdue</span>;
  }
  const classes = {
    pending:     'badge-pending',
    'in-progress': 'badge-in-progress',
    completed:   'badge-completed',
  };
  const labels = {
    pending:     'Pending',
    'in-progress': 'In Progress',
    completed:   'Completed',
  };
  return <span className={classes[status] || 'badge'}>{labels[status] || status}</span>;
}

export function PriorityBadge({ priority }) {
  const classes = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
  return (
    <span className={classes[priority] || 'badge'}>
      {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </span>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge ${role === 'admin' ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' : 'bg-slate-700 text-slate-300'}`}>
      {role?.charAt(0).toUpperCase() + role?.slice(1)}
    </span>
  );
}
