import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const MENU = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    label: 'EMT',
    roles: ['EMT'],
    items: [
      { to: '/scan',   icon: '📱', label: 'Start Audit' },
      { to: '/audits', icon: '📋', label: 'My Audits' },
    ],
  },
  {
    label: 'Administration',
    roles: ['ADMIN'],
    items: [
      { to: '/admin/ambulances', icon: '🚑', label: 'Ambulances' },
      { to: '/admin/templates',  icon: '📄', label: 'Templates' },
      { to: '/admin/users',      icon: '👥', label: 'User Management' },
    ],
  },
  {
    label: 'Supervisor',
    roles: ['SUPERVISOR', 'ADMIN'],
    items: [
      { to: '/supervisor/actions', icon: '⚠️', label: 'Open Issues' },
      { to: '/audits',             icon: '📋', label: 'Audit Log' },
    ],
  },
  {
    label: 'Reports',
    roles: ['SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW'],
    items: [
      { to: '/reports', icon: '📈', label: 'CQI Report' },
    ],
  },
  {
    label: 'Records',
    roles: ['ASSESSOR_VIEW'],
    items: [
      { to: '/audits', icon: '📋', label: 'Audit Log' },
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
  /* Desktop: always full width. Mobile: overlay width. No collapsed state on desktop. */
  const W = isMobile ? 260 : 240;
  const showAsOverlay = isMobile && mobileOpen;
  const showExpanded = !isMobile || mobileOpen; /* desktop always expanded; mobile shows labels when overlay open */

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
          background: 'var(--sidebar-bg)',
          display: 'flex', flexDirection: 'column',
          transition: isMobile ? 'transform .25s cubic-bezier(.4,0,.2,1)' : 'width .22s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          borderRight: '1px solid #c5d0dc',
          boxShadow: 'var(--shadow-sm)',
        }}
      >

      {/* ── Brand header (desktop: always full; mobile: overlay) ── */}
      <div
        style={{
          height: 56, flexShrink: 0,
          padding: '0 1rem',
          display: 'flex', alignItems: 'center', gap: '.75rem',
          borderBottom: '1px solid #c5d0dc',
          background: 'var(--sidebar-header)',
          minWidth: 0,
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'var(--grad-hero)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
        }}>
          🚑
        </div>
        {showExpanded && (
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              Ambulance QR
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              Audit System
            </div>
          </div>
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
        padding: '.6rem .75rem',
      }}>
        {visibleGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: '.25rem' }}>
            {/* Section label */}
            {showExpanded ? (
              <div style={{
                fontSize: '11px', fontWeight: 600, letterSpacing: '.08em',
                textTransform: 'uppercase', color: 'var(--sidebar-text-dim)',
                padding: '.75rem .85rem .3rem',
                userSelect: 'none',
              }}>
                {group.label}
              </div>
            ) : (
              <div style={{ margin: '.5rem .4rem .2rem', borderTop: '1px solid #c5d0dc' }} />
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
                        color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
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
                          color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
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
            fontSize: '11px', fontWeight: 600, letterSpacing: '.08em',
            textTransform: 'uppercase', color: 'var(--sidebar-text-dim)',
            padding: '.6rem .85rem .22rem',
          }}>
            Account
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '.65rem',
              padding: '.5rem .85rem', borderRadius: 8, width: '100%',
              background: 'transparent', border: 'none', cursor: 'pointer',
              textAlign: 'left', transition: 'background .12s',
              color: 'var(--sidebar-text)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '15px', color: 'var(--sidebar-text-dim)' }}>🚪</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Sign Out</span>
          </button>
        </div>
      )}

      <div style={{
        borderTop: '1px solid #c5d0dc',
        padding: (collapsed && !isMobile) ? '.6rem .5rem' : '.75rem 1rem',
        flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: (collapsed && !isMobile) ? 'center' : 'space-between',
        gap: '.5rem',
        background: 'var(--sidebar-header)',
      }}>
        {showExpanded ? (
          <>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--sidebar-text-dim)', fontWeight: 600 }}>
                Ambulance QR v1.0
              </div>
              <div style={{ fontSize: '12px', color: 'var(--sidebar-active-bg)', fontWeight: 600 }}>
                {rm.label}
              </div>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--sidebar-active-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.7rem', fontWeight: 700, color: '#fff', flexShrink: 0,
              cursor: 'default',
            }} title={user?.name}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </>
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--sidebar-active-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.7rem', fontWeight: 700, color: '#fff',
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
