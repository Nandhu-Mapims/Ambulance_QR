import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const MENU = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    ],
  },
  {
    label: 'EMT',
    roles: ['EMT'],
    items: [
      { to: '/scan',   icon: '◉', label: 'Scan QR' },
      { to: '/audits', icon: '≡', label: 'My Audits' },
    ],
  },
  {
    label: 'Administration',
    roles: ['ADMIN'],
    items: [
      { to: '/admin/ambulances', icon: '⊕', label: 'Ambulances' },
      { to: '/admin/templates',  icon: '▤', label: 'Templates' },
      { to: '/admin/users',      icon: '◉', label: 'User Management' },
    ],
  },
  {
    label: 'Supervisor',
    roles: ['SUPERVISOR', 'ADMIN'],
    items: [
      { to: '/supervisor/actions', icon: '⚡', label: 'Open Issues' },
      { to: '/audits',             icon: '≡', label: 'Audit Log' },
    ],
  },
  {
    label: 'Reports',
    roles: ['SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW'],
    items: [
      { to: '/reports', icon: '◈', label: 'CQI Report' },
    ],
  },
  {
    label: 'Records',
    roles: ['ASSESSOR_VIEW'],
    items: [
      { to: '/audits', icon: '≡', label: 'Audit Log' },
    ],
  },
];

const ROLE_META = {
  ADMIN:         { label: 'Administrator', color: '#4f46e5' },
  SUPERVISOR:    { label: 'Supervisor',    color: '#0891b2' },
  EMT:           { label: 'EMT',           color: '#059669' },
  ASSESSOR_VIEW: { label: 'Assessor',      color: '#7c3aed' },
};

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, isMobile, onNavClick }) {
  const { user, logout, hasRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast('Signed out', 'info');
    navigate('/login');
    onNavClick?.();
  };

  const seenItems = new Set();
  const visibleGroups = MENU
    .filter((g) => !g.roles || g.roles.some((r) => hasRole(r)))
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (seenItems.has(item.to)) return false;
        seenItems.add(item.to);
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);

  const rm = ROLE_META[user?.role] || ROLE_META.EMT;
  const W = collapsed ? 54 : 240;
  const showAsOverlay = isMobile && mobileOpen;
  const showExpanded = !collapsed || isMobile; /* on mobile overlay always show full menu */

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          className={`sidebar-backdrop ${mobileOpen ? 'sidebar-backdrop--open' : ''}`}
          onClick={onMobileClose}
          onKeyDown={(e) => e.key === 'Enter' && onMobileClose()}
        />
      )}
      <aside
        className={`sidebar-aside ${isMobile ? 'sidebar-aside--mobile' : ''} ${showAsOverlay ? 'sidebar-aside--open' : ''}`}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: isMobile ? 260 : W,
          zIndex: 1040,
          background: '#ffffff',
          display: 'flex', flexDirection: 'column',
          transition: isMobile ? 'transform .25s cubic-bezier(.4,0,.2,1)' : 'width .22s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          borderRight: '1px solid #e8edf3',
          boxShadow: '2px 0 8px rgba(0,0,0,.05)',
        }}
      >

      {/* ── Brand header ── */}
      <div style={{
        height: 54, flexShrink: 0,
        padding: collapsed ? '0 .75rem' : '0 1.1rem',
        display: 'flex', alignItems: 'center', gap: '.65rem',
        borderBottom: '1px solid #e8edf3',
        background: '#fff',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.05rem',
        }}>
          🚑
        </div>
        {showExpanded && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              AmbulanceQR
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              Audit System
            </div>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={onToggle}
            style={{
              marginLeft: collapsed ? 0 : 'auto',
              background: 'transparent', border: 'none',
              color: '#b0bac8', width: 24, height: 24, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '15px', borderRadius: 4,
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b0bac8'; }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        )}
        {isMobile && (
          <button
            type="button"
            onClick={onMobileClose}
            className="sidebar-close-mobile"
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: collapsed ? '.6rem .5rem' : '.6rem .75rem',
      }}>
        {visibleGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: '.25rem' }}>
            {/* Section label */}
            {showExpanded ? (
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '.09em',
                textTransform: 'uppercase', color: '#b0bac8',
                padding: '.6rem .6rem .22rem',
                userSelect: 'none',
              }}>
                {group.label}
              </div>
            ) : (
              <div style={{ margin: '.45rem .4rem .2rem', borderTop: '1px solid #f1f5f9' }} />
            )}

            {group.items.map((item) => (
              <NavLink
                key={item.to + group.label}
                to={item.to}
                title={collapsed ? item.label : undefined}
                onClick={onNavClick}
                className={({ isActive }) =>
                  [
                    'sidebar-link',
                    collapsed && !isMobile && 'sidebar-link--collapsed',
                    isActive && 'sidebar-link--active',
                    isMobile && 'sidebar-link--touch',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      style={{
                        fontSize: '15px',
                        lineHeight: 1,
                        flexShrink: 0,
                        color: isActive ? '#fff' : '#64748b',
                        fontFamily: 'system-ui, sans-serif',
                      }}
                    >
                      {item.icon}
                    </span>
                    {showExpanded && (
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#fff' : '#374151',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Account / Sign Out ── */}
      {showExpanded && (
        <div style={{ padding: '0 .75rem .4rem' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '.09em',
            textTransform: 'uppercase', color: '#b0bac8',
            padding: '.6rem .6rem .22rem',
          }}>
            Account
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '.65rem',
              padding: '.46rem .75rem', borderRadius: 7, width: '100%',
              background: 'transparent', border: 'none', cursor: 'pointer',
              textAlign: 'left', transition: 'background .12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '15px', color: '#94a3b8' }}>⏻</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Sign Out</span>
          </button>
        </div>
      )}

      {/* ── Footer: version + collapsed logout ── */}
      <div style={{
        borderTop: '1px solid #e8edf3',
        padding: (collapsed && !isMobile) ? '.55rem .5rem' : '.65rem 1.1rem',
        flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: (collapsed && !isMobile) ? 'center' : 'space-between',
        gap: '.4rem',
      }}>
        {showExpanded ? (
          <>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                AmbulanceQR v1.0
              </div>
              <div style={{ fontSize: '11px', color: rm.color, fontWeight: 700 }}>
                {rm.label}
              </div>
            </div>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: `linear-gradient(135deg,${rm.color},#3b82f6)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.7rem', fontWeight: 800, color: '#fff', flexShrink: 0,
              cursor: 'default',
            }} title={user?.name}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </>
        ) : (
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: `linear-gradient(135deg,${rm.color},#3b82f6)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.7rem', fontWeight: 800, color: '#fff',
            cursor: 'default',
          }} title={user?.name}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
