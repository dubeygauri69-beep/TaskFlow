import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../api/services';
import toast from 'react-hot-toast';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.length < 2) errs.name = 'Project name must be at least 2 characters';
    if (form.description.length > 500) errs.description = 'Description cannot exceed 500 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await projectApi.create(form);
      toast.success('Project created!');
      navigate(`/projects/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">New Project</h1>
        <p className="text-slate-400 text-sm mt-1">Create a project to start organizing your team</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} noValidate id="new-project-form">
          <div className="space-y-5">
            <div>
              <label htmlFor="project-name" className="label">Project Name <span className="text-red-400">*</span></label>
              <input
                id="project-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g. Website Redesign"
                maxLength={100}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="project-description" className="label">
                Description <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                id="project-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className={`input resize-none ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describe the project goals and scope..."
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.description ? (
                  <p className="text-red-400 text-xs">{errors.description}</p>
                ) : <span />}
                <span className="text-xs text-slate-500">{form.description.length}/500</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                id="create-project-submit"
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                ) : (
                  'Create Project'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
