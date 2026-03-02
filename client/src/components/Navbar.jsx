import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ROLE_COLOR = { ADMIN: '#fbbf24', SUPERVISOR: '#fb923c', EMT: '#4ade80', ASSESSOR_VIEW: '#67e8f9' };

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast('Logged out successfully', 'info');
    navigate('/login');
  };

  const nl = (to, label, icon) => (
    <li className="nav-item">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `nav-link qr-navbar-link ${isActive ? 'active' : ''}`
        }
      >
        {icon && <span className="me-1" style={{ fontSize: '1em' }}>{icon}</span>}
        {label}
      </NavLink>
    </li>
  );

  return (
    <nav className="navbar navbar-expand-lg qr-navbar">
      <div className="container-fluid px-3 px-lg-4">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.3))' }}>🚑</span>
          <span style={{ letterSpacing: '-.03em', fontWeight: 900 }}>AmbulanceQR</span>
        </Link>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMain"
          aria-controls="navMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ color: 'rgba(255,255,255,.8)' }}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navMain">
          {user ? (
            <>
              <ul className="navbar-nav me-auto gap-1">
                {nl('/dashboard', 'Home', '🏠')}
                {hasRole('EMT')                               && nl('/scan',               'Scan QR',      '📷')}
                {hasRole('ADMIN')                             && nl('/admin/ambulances',   'Ambulances',   '🚑')}
                {hasRole('ADMIN')                             && nl('/admin/templates',    'Templates',    '📋')}
                {hasRole('ADMIN')                             && nl('/admin/users',        'Users',        '👤')}
                {hasRole('SUPERVISOR', 'ADMIN')               && nl('/supervisor/actions', 'Issues',       '⚠️')}
                {hasRole('SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW') && nl('/reports',         'Reports',      '📊')}
                {nl('/audits', 'Audit Log', '📄')}
              </ul>

              <div className="d-flex align-items-center gap-3 mt-2 mt-lg-0">
                {/* User pill */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '.5rem',
                  background: 'rgba(255,255,255,.15)', borderRadius: 99,
                  padding: '.3rem .75rem .3rem .4rem',
                  backdropFilter: 'blur(4px)',
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: ROLE_COLOR[user.role] || '#e5e7eb',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.7rem', fontWeight: 800, color: '#1a1a2e',
                    flexShrink: 0,
                  }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ color: '#fff', fontSize: '.82rem', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </span>
                  <span style={{
                    fontSize: '.65rem', fontWeight: 800, letterSpacing: '.06em',
                    color: ROLE_COLOR[user.role] || '#e5e7eb',
                    background: 'rgba(0,0,0,.25)', borderRadius: 99, padding: '.1rem .4rem',
                  }}>
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.25)',
                    borderRadius: 8, color: '#fff', fontSize: '.82rem', fontWeight: 600,
                    padding: '.35rem .85rem', cursor: 'pointer', transition: 'all .2s',
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,.28)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,.18)'}
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/login">Sign In</Link>
              </li>
            </ul>
          )}
        </div>
      </div>

      <style>{`
        .qr-navbar-link {
          color: rgba(255,255,255,.8) !important;
          font-weight: 500;
          font-size: .875rem;
          border-radius: 8px;
          padding: .38rem .8rem !important;
          transition: all .2s;
        }
        .qr-navbar-link:hover {
          color: #fff !important;
          background: rgba(255,255,255,.15);
        }
        .qr-navbar-link.active {
          color: #fff !important;
          background: rgba(255,255,255,.22);
          font-weight: 700;
        }
      `}</style>
    </nav>
  );
}
