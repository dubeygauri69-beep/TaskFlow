import api from './axios';

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login:  (data) => api.post('/auth/login', data),
  getMe:  ()     => api.get('/auth/me'),
};

export const projectApi = {
  getAll:       ()           => api.get('/projects'),
  getOne:       (id)         => api.get(`/projects/${id}`),
  create:       (data)       => api.post('/projects', data),
  update:       (id, data)   => api.put(`/projects/${id}`, data),
  remove:       (id)         => api.delete(`/projects/${id}`),
  addMember:    (id, email)  => api.post(`/projects/${id}/members`, { email }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

export const taskApi = {
  getMyTasks:    ()                 => api.get('/tasks'),
  getByProject:  (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  getOne:        (projectId, id)    => api.get(`/tasks/project/${projectId}/${id}`),
  create:        (projectId, data)  => api.post(`/tasks/project/${projectId}`, data),
  update:        (projectId, id, data) => api.put(`/tasks/project/${projectId}/${id}`, data),
  remove:        (projectId, id)    => api.delete(`/tasks/project/${projectId}/${id}`),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
};

export const userApi = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
};
