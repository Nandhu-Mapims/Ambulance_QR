import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @param {string[]} roles  Allowed roles. Empty = any authenticated user.
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">🚫</div>
        <h2 className="text-danger fw-bold">Access Denied</h2>
        <p className="text-muted">Your role <strong>{user.role}</strong> cannot access this page.</p>
      </div>
    );
  }

  return children;
}
