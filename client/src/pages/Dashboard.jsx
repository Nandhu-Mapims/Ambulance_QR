import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/** Animated counter that counts up from 0 to value. */
function Counter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 900;
    const step = 16;
    const increment = value / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

const STAT_DEFS = [
  { key: 'ambulances',  label: 'Ambulances',     icon: '🚑', color: '#dc2626', bg: '#fef2f2' },
  { key: 'audits',      label: 'Total Audits',   icon: '📋', color: '#2563eb', bg: '#eff6ff' },
  { key: 'needAction',  label: 'Need Action',    icon: '⚠️', color: '#d97706', bg: '#fffbeb' },
  { key: 'avgScore',    label: 'Avg Compliance', icon: '📊', color: '#16a34a', bg: '#f0fdf4', suffix: '%' },
];

const ROLE_QUICK_LINKS = {
  ADMIN: [
    { to: '/admin/ambulances', icon: '🚑', label: 'Manage Ambulances', desc: 'Register, update & generate QR codes' },
    { to: '/admin/templates',  icon: '📋', label: 'Checklist Templates', desc: 'Build & activate audit templates' },
    { to: '/admin/users',      icon: '👤', label: 'User Management', desc: 'Add & manage system users' },
    { to: '/reports',          icon: '📊', label: 'CQI Reports', desc: 'Export compliance reports' },
  ],
  SUPERVISOR: [
    { to: '/supervisor/actions', icon: '⚠️', label: 'Open Issues', desc: 'Review & close corrective actions' },
    { to: '/audits',             icon: '📄', label: 'Audit Log', desc: 'View all submitted audits' },
    { to: '/reports',            icon: '📊', label: 'CQI Reports', desc: 'Compliance quality reports' },
  ],
  EMT: [
    { to: '/scan',   icon: '📷', label: 'Start Audit', desc: 'Scan QR code or enter plate manually' },
    { to: '/audits', icon: '📄', label: 'My Audits', desc: 'View your submission history' },
  ],
  ASSESSOR_VIEW: [
    { to: '/reports', icon: '📊', label: 'CQI Reports', desc: 'View compliance quality reports' },
    { to: '/audits',  icon: '📄', label: 'Audit Log', desc: 'Browse all audit records' },
  ],
};

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);

  const canFetchCqi = hasRole('ADMIN', 'SUPERVISOR', 'ASSESSOR_VIEW');

  useEffect(() => {
    const promises = [
      api.get('/ambulances').catch(() => ({ data: { count: 0 } })),
      api.get('/audits', { params: { limit: 1 } }).catch(() => ({ data: { total: 0 } })),
      api.get('/audits', { params: { status: 'NEED_ACTION', limit: 1 } }).catch(() => ({ data: { total: 0 } })),
    ];
    if (canFetchCqi) {
      promises.push(api.get('/reports/cqi').catch(() => ({ data: { summary: [] } })));
    }

    Promise.all(promises).then((results) => {
      const [amb, audits, need] = results;
      const cqi = canFetchCqi ? results[3] : { data: { summary: [] } };
      const summaries = cqi?.data?.summary ?? [];
      const avg = summaries.length
        ? Math.round(summaries.reduce((s, x) => s + (x.avgScore ?? 0), 0) / summaries.length)
        : 0;
      setStats({
        ambulances: amb?.data?.count ?? 0,
        audits: audits?.data?.total ?? 0,
        needAction: need?.data?.total ?? 0,
        avgScore: avg,
      });
    });
  }, [canFetchCqi]);

  const links = ROLE_QUICK_LINKS[user?.role] || ROLE_QUICK_LINKS.ASSESSOR_VIEW;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-shell">
      {/* Page heading */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.35rem', color: '#0f172a', marginBottom: '.25rem' }}>
            {greeting}, {user?.name} 👋
          </h2>
          <p style={{ color: '#64748b', fontSize: '.9rem', margin: 0 }}>
            {user?.role?.replace('_', ' ')} · {user?.station || 'No Station'}
          </p>
        </div>
        <span style={{
          fontSize: '.7rem', fontWeight: 600, letterSpacing: '.05em',
          textTransform: 'uppercase', color: 'var(--primary)', background: 'var(--blue-50)',
          padding: '.3rem .7rem', borderRadius: 8, border: '1px solid var(--blue-100)',
          alignSelf: 'center',
        }}>
          {user?.role?.replace('_', ' ')}
        </span>
      </div>

      {/* KPI stat cards — spacious grid */}
      {(hasRole('ADMIN', 'SUPERVISOR', 'ASSESSOR_VIEW')) && (
        <div className="row g-3 mb-4">
          {STAT_DEFS.map((s, i) => (
            <div key={s.key} className={`col-6 col-lg-3 anim-fade-up anim-delay-${i + 1}`}>
              <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 20,
                padding: '1.25rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'var(--transition)',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.35rem',
                }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>
                    {stats ? <Counter value={stats[s.key]} /> : '—'}{s.suffix ?? ''}
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#64748b', fontWeight: 600, marginTop: '.15rem' }}>
                    {s.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Access — flat cards */}
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex', alignItems: 'center', gap: '.5rem',
        }}>
          <span style={{
            fontSize: '.7rem', fontWeight: 600, letterSpacing: '.08em',
            textTransform: 'uppercase', color: '#64748b',
          }}>
            Quick Access
          </span>
        </div>
        <div style={{
          padding: '1rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          {links.map((link, i) => (
            <Link key={link.to + i} to={link.to} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.1rem', borderRadius: 12,
                border: '1px solid var(--card-border)', background: 'var(--slate-50)',
                transition: 'var(--transition)', cursor: 'pointer',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--blue-50)';
                  e.currentTarget.style.borderColor = 'var(--blue-100)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--slate-50)';
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem',
                }}>
                  {link.icon}
                </div>
                <div>
                  <div style={{ fontSize: '.9rem', fontWeight: 600, color: '#0f172a', marginBottom: '.15rem' }}>
                    {link.label}
                  </div>
                  <div style={{ fontSize: '.8rem', color: '#64748b' }}>{link.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* EMT quick-start CTA */}
      {hasRole('EMT') && (
        <div className="mt-4 anim-fade-up anim-delay-3">
          <Link to="/scan" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--grad-hero)',
              borderRadius: 20, padding: '1.25rem 1.5rem',
              color: '#fff', display: 'flex', alignItems: 'center', gap: '1.25rem',
              boxShadow: 'var(--shadow-md)',
              transition: 'var(--transition)',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            >
              <div style={{ fontSize: '2.25rem', lineHeight: 1 }}>📷</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '.2rem' }}>Ready to start an audit?</div>
                <div style={{ opacity: .9, fontSize: '.85rem' }}>Scan the QR sticker on any ambulance to begin</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '1.25rem', opacity: .8 }}>→</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
