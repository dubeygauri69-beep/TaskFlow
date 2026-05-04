import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { format } from 'date-fns';

function ProjectCard({ project }) {
  const completionPct =
    project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;

  return (
    <Link
      to={`/projects/${project._id}`}
      className="card block hover:border-primary-600/50 hover:bg-surface-hover transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 group-hover:text-primary-300 transition-colors truncate">
            {project.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
        <span className={`badge ml-2 flex-shrink-0 ${project.status === 'active' ? 'bg-green-900/50 text-green-300 border border-green-700/50' : 'bg-slate-700 text-slate-400'}`}>
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>{project.completedCount}/{project.taskCount} tasks completed</span>
          <span>{completionPct}%</span>
        </div>
        <div className="w-full bg-surface-hover rounded-full h-1.5">
          <div
            className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.members.slice(0, 4).map((m) => (
            <div
              key={m._id}
              title={m.name}
              className="w-7 h-7 rounded-full bg-primary-700 border-2 border-surface-card flex items-center justify-center text-xs font-medium text-white"
            >
              {m.name?.[0]?.toUpperCase()}
            </div>
          ))}
          {project.members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-surface-hover border-2 border-surface-card flex items-center justify-center text-xs text-slate-400">
              +{project.members.length - 4}
            </div>
          )}
        </div>
        <span className="text-xs text-primary-400 font-medium group-hover:underline">View details</span>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const { isAdmin }     = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await projectApi.getAll();
        setProjects(res.data.data);
      } catch {
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <Spinner className="h-96" size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAdmin ? 'Projects you manage' : 'Projects you are a member of'}
          </p>
        </div>
        {isAdmin && (
          <Link to="/projects/new" id="create-project-btn" className="btn-primary text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>
        )}
      </div>

      {error && <div className="card text-red-400 text-center">{error}</div>}

      {!error && projects.length === 0 ? (
        <div className="card text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <p className="text-slate-400 font-medium">No projects yet</p>
          {isAdmin && (
            <Link to="/projects/new" className="btn-primary mt-4 inline-block text-sm">
              Create your first project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p._id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
