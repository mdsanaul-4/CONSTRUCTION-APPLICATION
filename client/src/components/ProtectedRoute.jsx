import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner full label="Checking your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
