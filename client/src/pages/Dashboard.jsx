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
  { key: 'ambulances',  label: 'Ambulances',       icon: '🚑', color: '#dc2626', bg: '#fef2f2' },
  { key: 'audits',      label: 'Total Audits',      icon: '📋', color: '#2563eb', bg: '#eff6ff' },
  { key: 'needAction',  label: 'Need Action',       icon: '⚠️', color: '#d97706', bg: '#fffbeb' },
  { key: 'avgScore',    label: 'Avg Compliance',    icon: '📊', color: '#16a34a', bg: '#f0fdf4', suffix: '%' },
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

  useEffect(() => {
    Promise.all([
      api.get('/ambulances').catch(() => ({ data: { count: 0 } })),
      api.get('/audits', { params: { limit: 1 } }).catch(() => ({ data: { total: 0 } })),
      api.get('/audits', { params: { status: 'NEED_ACTION', limit: 1 } }).catch(() => ({ data: { total: 0 } })),
      api.get('/reports/cqi').catch(() => ({ data: { summary: [] } })),
    ]).then(([amb, audits, need, cqi]) => {
      const summaries = cqi.data.summary || [];
      const avg = summaries.length
        ? Math.round(summaries.reduce((s, x) => s + x.avgScore, 0) / summaries.length)
        : 0;
      setStats({
        ambulances: amb.data.count ?? 0,
        audits: audits.data.total ?? 0,
        needAction: need.data.total ?? 0,
        avgScore: avg,
      });
    });
  }, []);

  const links = ROLE_QUICK_LINKS[user?.role] || ROLE_QUICK_LINKS.ASSESSOR_VIEW;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-shell">
      {/* ── Page heading row ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '.9rem',
      }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', marginBottom: '.15rem' }}>
            {greeting}, {user?.name} 👋
          </h2>
          <p style={{ color: '#64748b', fontSize: '.78rem', margin: 0 }}>
            {user?.role?.replace('_', ' ')} &nbsp;·&nbsp; {user?.station || 'No Station'}
          </p>
        </div>
        <span style={{
          fontSize: '.68rem', fontWeight: 700, letterSpacing: '.04em',
          textTransform: 'uppercase', color: '#4f46e5', background: '#eef2ff',
          padding: '.2rem .6rem', borderRadius: 6, border: '1px solid #c7d2fe',
          alignSelf: 'center',
        }}>
          {user?.role?.replace('_', ' ')}
        </span>
      </div>

      {/* ── Stat cards ── */}
      {(hasRole('ADMIN', 'SUPERVISOR', 'ASSESSOR_VIEW')) && (
        <div className="row g-2 mb-3">
          {STAT_DEFS.map((s, i) => (
            <div key={s.key} className={`col-6 col-lg-3 anim-fade-up anim-delay-${i + 1}`}>
              <div style={{
                background: '#fff',
                border: '1px solid #e8edf3',
                borderRadius: 8,
                padding: '.85rem 1rem',
                display: 'flex', alignItems: 'center', gap: '.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,.05)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                  background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.15rem',
                }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                    {stats ? <Counter value={stats[s.key]} /> : '—'}{s.suffix}
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#64748b', fontWeight: 600, marginTop: '.1rem' }}>
                    {s.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Quick access table-style ── */}
      <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
        <div style={{ padding: '.65rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
            Quick Access
          </span>
        </div>
        <div style={{ padding: '.5rem .75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '.5rem' }}>
          {links.map((link, i) => (
            <Link key={link.to + i} to={link.to} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                padding: '.65rem .85rem', borderRadius: 7,
                border: '1px solid #e8edf3', background: '#fafbfc',
                transition: 'all .15s', cursor: 'pointer',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.borderColor = '#e8edf3'; }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                  background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem',
                }}>
                  {link.icon}
                </div>
                <div>
                  <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#0f172a', marginBottom: '.05rem' }}>
                    {link.label}
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#94a3b8' }}>{link.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* EMT quick-start CTA */}
      {hasRole('EMT') && (
        <div className="mt-3 anim-fade-up anim-delay-3">
          <Link to="/scan" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(120deg,#1e3a8a,#1d4ed8)',
              borderRadius: 8, padding: '1rem 1.25rem',
              color: '#fff', display: 'flex', alignItems: 'center', gap: '1rem',
              boxShadow: '0 4px 16px rgba(29,78,216,.3)',
            }}>
              <div style={{ fontSize: '2rem', lineHeight: 1 }}>📷</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.1rem' }}>Ready to start an audit?</div>
                <div style={{ opacity: .8, fontSize: '.75rem' }}>Scan the QR sticker on any ambulance to begin</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '1.1rem', opacity: .7 }}>→</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
