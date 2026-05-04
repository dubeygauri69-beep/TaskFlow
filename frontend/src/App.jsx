import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage        from './pages/LoginPage';
import SignupPage       from './pages/SignupPage';
import DashboardPage    from './pages/DashboardPage';
import ProjectsPage     from './pages/ProjectsPage';
import NewProjectPage   from './pages/NewProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import MyTasksPage      from './pages/MyTasksPage';
import NotFoundPage     from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes - redirect to dashboard if logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Protected routes - require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects"  element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/my-tasks"  element={<MyTasksPage />} />

            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/projects/new" element={<NewProjectPage />} />
            </Route>
          </Route>
        </Route>

        {/* Default redirects */}
        <Route path="/"   element={<Navigate to="/dashboard" replace />} />
        <Route path="*"   element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
