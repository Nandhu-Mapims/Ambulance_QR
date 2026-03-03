import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @param {string[]} roles  Allowed roles. Empty = any authenticated user.
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const path = location.pathname + location.search;
  const loginWithReturnTo = `/login?returnTo=${encodeURIComponent(path)}`;

  // Unauthenticated → always go to login, remembering where we came from
  if (!user) {
    return <Navigate to={loginWithReturnTo} replace />;
  }

  // Role mismatch
  if (roles.length > 0 && !hasRole(...roles)) {
    const isAuditFlow = location.pathname.startsWith('/audit/');
    if (isAuditFlow) {
      // For QR / EMT pages, force re-login with EMT account instead of showing Access Denied
      return <Navigate to={loginWithReturnTo} replace />;
    }

    return (
      <div className="container text-center py-5">
        <div className="display-1 mb-3">🚫</div>
        <h2 className="text-danger fw-bold">Access Denied</h2>
        <p className="text-muted">
          Your role <strong>{user.role}</strong> cannot access this page.
        </p>
      </div>
    );
  }

  return children;
}
