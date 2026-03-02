import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

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

const MOBILE_BREAKPOINT = 768;

/** Sidebar shell + all protected routes. */
function AuthedLayout() {
  const [collapsed, setCollapsed] = useState(false);
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

  const sideW = isMobile ? 0 : (collapsed ? 54 : 240);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f9' }} className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        isMobile={isMobile}
        onNavClick={() => setMobileMenuOpen(false)}
      />

      <main style={{
        marginLeft: sideW,
        flex: 1,
        minWidth: 0,
        transition: 'margin-left .22s cubic-bezier(.4,0,.2,1)',
        display: 'flex',
        flexDirection: 'column',
      }} className="app-main">
        {/* ── Top bar ── */}
        <header className="app-header" style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: '#fff',
          borderBottom: '1px solid #e8edf3',
          padding: isMobile ? '0 .75rem' : '0 1.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 54,
          boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        }}>
          {/* Left: menu button (mobile) + branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="sidebar-toggle-mobile"
                aria-label="Open menu"
              >
                <span className="sidebar-toggle-mobile-icon">≡</span>
              </button>
            )}
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', flexShrink: 0,
            }}>🚑</div>
            <div className="app-brand">
              <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
                Ambulance QR Audit
              </div>
              {!isMobile && (
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.2 }}>
                  Medical Operations Department
                </div>
              )}
            </div>
          </div>

          {/* Right: station + role + user */}
          <div className="app-header-right" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            {user?.station && !isMobile && (
              <span style={{
                fontSize: '12px', fontWeight: 600,
                color: '#475569', background: '#f1f5f9',
                padding: '.2rem .65rem', borderRadius: 6,
                border: '1px solid #e2e8f0',
              }}>
                📍 {user.station}
              </span>
            )}
            {!isMobile && (
              <span style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '.04em',
                textTransform: 'uppercase',
                color: '#4f46e5', background: '#eef2ff',
                padding: '.2rem .55rem', borderRadius: 5,
                border: '1px solid #c7d2fe',
              }}>
                {user?.role?.replace('_', ' ')}
              </span>
            )}
            {/* User avatar + name */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.4rem',
              background: '#f8faff', border: '1px solid #e2e8f0',
              padding: '.22rem .7rem .22rem .35rem', borderRadius: 99,
              cursor: 'default',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg,#4f46e5,#3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: '#fff',
                flexShrink: 0,
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 600, color: '#1e40af' }}>
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <div className="app-content" style={{ flex: 1, padding: isMobile ? '.75rem .85rem' : '1rem 1.25rem', width: '100%', boxSizing: 'border-box' }}>
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
      </main>
    </div>
  );
}
