import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import MobileBottomNav, { MOBILE_BREAKPOINT } from './components/MobileBottomNav';

// Auth
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// EMT
import AuditLanding from './pages/emt/AuditLanding';
import AuditScan from './pages/emt/AuditScan';
import AuditFill from './pages/emt/AuditFill';
import AuditSuccess from './pages/emt/AuditSuccess';

// Admin
import AmbulanceMaster from './pages/admin/AmbulanceMaster';
import TemplateBuilder from './pages/admin/TemplateBuilder';
import UserManagement from './pages/admin/UserManagement';

// Supervisor
import OpenIssues from './pages/supervisor/OpenIssues';
import CloseAction from './pages/supervisor/CloseAction';

// Reports
import CQIReport from './pages/reports/CQIReport';

// Shared
import AuditLog from './pages/AuditLog';
import AuditDetail from './pages/AuditDetail';

const PR = ({ roles, children }) => (
  <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"    element={<AuthedLayout />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

/** Sidebar shell + all protected routes. */
function AuthedLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
  const { user } = useAuth();

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Redirect unauthenticated users */
  if (!user) return <Navigate to="/login" replace />;

  /* Desktop: sidebar always expanded (no shrink). Mobile: overlay only. */
  const sideW = isMobile ? 0 : 240;

  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--slate-50)' }}>
      <Sidebar
        collapsed={false}
        onToggle={() => {}}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        isMobile={isMobile}
        onNavClick={() => setMobileMenuOpen(false)}
      />

      <main
        className={`app-main ${isMobile ? 'app-main--mobile' : ''}`}
        style={{
          marginLeft: sideW,
          flex: 1,
          minWidth: 0,
          transition: 'margin-left .22s cubic-bezier(.4,0,.2,1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top navigation bar */}
        <header className="app-header app-navbar">
          <div className="app-header-left">
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="sidebar-toggle-mobile"
                aria-label="Open menu"
              >
                <span className="sidebar-toggle-mobile-icon" aria-hidden>≡</span>
              </button>
            )}
            <div className="app-header-logo" aria-hidden>🚑</div>
            <div className="app-brand">
              <span className="app-brand-title">Ambulance QR Audit</span>
              {!isMobile && <span className="app-brand-subtitle">Medical Operations</span>}
            </div>
          </div>

          <div className="app-header-right">
            {user?.station && !isMobile && (
              <span className="app-header-station">📍 {user.station}</span>
            )}
            {!isMobile && (
              <span className="app-header-role">{user?.role?.replace('_', ' ') ?? ''}</span>
            )}
            <div className="app-header-user">
              <span className="app-header-avatar" aria-hidden>
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </span>
              <span className="app-header-name">{user?.name ?? 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <div className={`app-content ${isMobile ? 'app-content--mobile' : ''}`}>
          <Routes>
            <Route path="/audit/:numberPlate"          element={<PR><AuditLanding /></PR>} />
            <Route path="/audit/:numberPlate/fill"     element={<PR roles={['EMT']}><AuditFill /></PR>} />
            <Route path="/audit-success"               element={<PR roles={['EMT']}><AuditSuccess /></PR>} />
            <Route path="/scan"                        element={<PR roles={['EMT']}><AuditScan /></PR>} />
            <Route path="/admin/ambulances"            element={<PR roles={['ADMIN']}><AmbulanceMaster /></PR>} />
            <Route path="/admin/templates"             element={<PR roles={['ADMIN']}><TemplateBuilder /></PR>} />
            <Route path="/admin/users"                 element={<PR roles={['ADMIN']}><UserManagement /></PR>} />
            <Route path="/supervisor/actions"          element={<PR roles={['SUPERVISOR','ADMIN']}><OpenIssues /></PR>} />
            <Route path="/supervisor/actions/:auditId" element={<PR roles={['SUPERVISOR','ADMIN']}><CloseAction /></PR>} />
            <Route path="/reports"                     element={<PR roles={['SUPERVISOR','ADMIN','ASSESSOR_VIEW']}><CQIReport /></PR>} />
            <Route path="/audits"                      element={<PR><AuditLog /></PR>} />
            <Route path="/audits/:id"                  element={<PR><AuditDetail /></PR>} />
            <Route path="/dashboard"                   element={<PR><Dashboard /></PR>} />
            <Route path="/"                            element={<PR><Dashboard /></PR>} />
            <Route path="*"                            element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Mobile bottom navigation */}
        <MobileBottomNav isMobile={isMobile} onOpenMenu={() => setMobileMenuOpen(true)} />
      </main>
    </div>
  );
}
