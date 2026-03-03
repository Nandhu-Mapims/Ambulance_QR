/**
 * MobileBottomNav.jsx
 * Thumb-friendly bottom navigation bar shown only on mobile (≤768px).
 * Provides quick access to Dashboard, primary action, Audits, and Menu (opens sidebar).
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MOBILE_BREAKPOINT = 768;

const ITEMS = [
  { to: '/dashboard', icon: '📊', label: 'Home' },
  { to: '/scan', icon: '📷', label: 'Scan', roles: ['EMT'] },
  { to: '/admin/ambulances', icon: '🚑', label: 'Ambulances', roles: ['ADMIN'] },
  { to: '/admin/templates', icon: '📄', label: 'Templates', roles: ['ADMIN'] },
  { to: '/supervisor/actions', icon: '⚠️', label: 'Issues', roles: ['SUPERVISOR', 'ADMIN'] },
  { to: '/reports', icon: '📈', label: 'Reports', roles: ['SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW'] },
  { to: '/audits', icon: '📋', label: 'Audits' },
];

function getVisibleItems(hasRole) {
  const primary = ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((r) => hasRole(r));
  });
  const deduped = [];
  const seen = new Set();
  for (const item of primary) {
    if (seen.has(item.to)) continue;
    seen.add(item.to);
    deduped.push(item);
  }
  const home = deduped.find((i) => i.to === '/dashboard');
  const audits = deduped.find((i) => i.to === '/audits');
  const others = deduped.filter((i) => i.to !== '/dashboard' && i.to !== '/audits');
  const firstAction = others[0] ?? null;
  return { home, firstAction, audits };
}

export default function MobileBottomNav({ isMobile, onOpenMenu }) {
  const { hasRole } = useAuth();
  const { home, firstAction, audits } = getVisibleItems(hasRole);

  if (!isMobile) return null;

  const navItems = [
    home && { ...home, key: 'home' },
    firstAction && { ...firstAction, key: 'action' },
    audits && { ...audits, key: 'audits' },
  ].filter(Boolean);

  return (
    <nav
      className="mobile-bottom-nav"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${isActive ? 'mobile-bottom-nav-item--active' : ''}`
            }
            end={item.to === '/dashboard'}
          >
            <span className="mobile-bottom-nav-icon" aria-hidden>{item.icon}</span>
            <span className="mobile-bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className="mobile-bottom-nav-item mobile-bottom-nav-item--menu"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <span className="mobile-bottom-nav-icon" aria-hidden>☰</span>
          <span className="mobile-bottom-nav-label">Menu</span>
        </button>
      </div>
    </nav>
  );
}

export { MOBILE_BREAKPOINT };
