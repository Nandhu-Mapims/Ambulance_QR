import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { getApiBaseUrl } from '../../api/axios';
import Spinner from '../../components/Spinner';

const API_BASE = getApiBaseUrl();

/* ── Stat card ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color = 'primary', icon }) {
  return (
    <div className="col-6 col-md-3">
      <div className={`card border-0 shadow-sm h-100 border-top border-4 border-${color}`}>
        <div className="card-body text-center py-3">
          <div style={{ fontSize: '1.8rem' }}>{icon}</div>
          <div className={`fw-bold fs-3 text-${color}`}>{value}</div>
          <div className="small fw-semibold">{label}</div>
          {sub && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── Inline compliance (bar + %) for Fleet Summary ──────────────────────────── */
function ScoreBar({ score }) {
  const color = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger';
  return (
    <div className="d-flex align-items-center gap-2">
      <div className="progress flex-grow-1" style={{ height: 8, minWidth: 60 }}>
        <div className={`progress-bar bg-${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`small fw-semibold text-${color}`}>{score}%</span>
    </div>
  );
}

/* ── Status label for display ───────────────────────────────────────────────── */
function statusLabel(status) {
  if (status === 'NEED_ACTION') return 'Need action';
  if (status === 'CLOSED') return 'Closed';
  return 'Submitted';
}

export default function CQIReport() {
  const [filters, setFilters] = useState({ from: '', to: '', numberPlate: '', status: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (filters.from) p.set('from', filters.from);
    if (filters.to) p.set('to', filters.to);
    if (filters.numberPlate) p.set('numberPlate', filters.numberPlate);
    if (filters.status) p.set('status', filters.status);
    return p.toString();
  }, [filters]);

  const fetchReport = useCallback(() => {
    setLoading(true);
    setError('');
    api.get(`/reports/cqi?${buildParams()}`)
      .then(({ data: res }) => setData({
        ...res,
        summary: Array.isArray(res?.summary) ? res.summary : [],
        audits: Array.isArray(res?.audits) ? res.audits : [],
      }))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [buildParams]);

  useEffect(() => { fetchReport(); }, []);

  const downloadExcel = () => {
    const token = localStorage.getItem('accessToken');
    window.open(`${API_BASE}/reports/cqi/excel?${buildParams()}&_t=${token}`, '_blank');
  };
  const downloadPdf = () => {
    const token = localStorage.getItem('accessToken');
    window.open(`${API_BASE}/reports/cqi/pdf?${buildParams()}&_t=${token}`, '_blank');
  };

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  // Aggregate stats from data
  const stats = data
    ? (() => {
        const audits = data.audits ?? [];
        const total = audits.length;
        const avgScore = total > 0 ? Math.round(audits.reduce((s, a) => s + a.complianceScore, 0) / total) : 0;
        const needAction = audits.filter((a) => a.status === 'NEED_ACTION').length;
        const closed = audits.filter((a) => a.status === 'CLOSED').length;
        return { total, avgScore, needAction, closed };
      })()
    : null;

  return (
    <div className="page-shell">
      <div className="page-banner anim-fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="section-label mb-1" style={{ color: 'rgba(255,255,255,.7)' }}>Analytics</p>
            <h2 style={{ fontWeight: 900, letterSpacing: '-.04em' }}>CQI Report</h2>
            <p style={{ margin: 0, opacity: .85, fontSize: '.9rem' }}>Continuous Quality Improvement Dashboard</p>
          </div>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button onClick={downloadExcel} style={{ background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 10, padding: '.5rem 1.1rem', fontWeight: 700, cursor: 'pointer', fontSize: '.875rem', transition: 'all .2s' }}>
              📊 Excel
            </button>
            <button onClick={downloadPdf} style={{ background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 10, padding: '.5rem 1.1rem', fontWeight: 700, cursor: 'pointer', fontSize: '.875rem', transition: 'all .2s' }}>
              📄 PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <div className="card-body py-3 px-3 px-md-4">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-6 col-lg">
              <label className="form-label small fw-semibold mb-1" style={{ color: 'var(--primary-dark)' }}>From Date</label>
              <input type="date" className="form-control form-control-sm" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} aria-label="From date" />
            </div>
            <div className="col-12 col-md-6 col-lg">
              <label className="form-label small fw-semibold mb-1" style={{ color: 'var(--primary-dark)' }}>To Date</label>
              <input type="date" className="form-control form-control-sm" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} aria-label="To date" />
            </div>
            <div className="col-12 col-md-6 col-lg">
              <label className="form-label small fw-semibold mb-1" style={{ color: 'var(--primary-dark)' }}>Number Plate</label>
              <input type="text" className="form-control form-control-sm text-uppercase" value={filters.numberPlate} onChange={(e) => setFilter('numberPlate', e.target.value)} placeholder="All" aria-label="Filter by number plate" />
            </div>
            <div className="col-12 col-md-6 col-lg">
              <label className="form-label small fw-semibold mb-1" style={{ color: 'var(--primary-dark)' }}>Status</label>
              <select className="form-select form-select-sm" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status">
                <option value="">All statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="NEED_ACTION">Need action</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="col-12 col-md-6 col-lg-auto">
              <button type="button" className="btn btn-primary btn-sm w-100 w-md-auto px-4" onClick={fetchReport} disabled={loading} style={{ minHeight: 32 }}>
                {loading ? <span className="spinner-border spinner-border-sm" aria-hidden /> : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      {loading && (
        <div className="mb-4"><Spinner text="Loading report…" /></div>
      )}

      {/* Stat cards — show when we have data (including empty result) */}
      {!loading && data && stats && (
        <div className="row g-3 mb-4">
          <StatCard icon="📋" label="Total Audits" value={stats.total} color="primary" />
          <StatCard icon="📊" label="Avg Compliance" value={`${stats.avgScore}%`} color={stats.avgScore >= 80 ? 'success' : stats.avgScore >= 50 ? 'warning' : 'danger'} sub="across all audits" />
          <StatCard icon="⚠️" label="Need Action" value={stats.needAction} color="warning" sub="open issues" />
          <StatCard icon="✅" label="Resolved" value={stats.closed} color="success" sub="fully closed" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Fleet Summary — modern qr-table like Audit Log */}
          <h5 className="fw-bold mb-3" style={{ color: 'var(--primary-dark)' }}>Fleet Summary</h5>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            marginBottom: '2rem',
          }}>
            <div className="d-none d-md-block" style={{ overflowX: 'auto' }}>
              <table className="table qr-table mb-0" style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Number Plate</th>
                    <th>Type</th>
                    <th>Total Audits</th>
                    <th>Avg Compliance</th>
                    <th>Need Action</th>
                    <th>Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.summary ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--sidebar-text-dim)', padding: '2rem' }}>
                        No data for selected filters. Adjust dates or filters and click Apply.
                      </td>
                    </tr>
                  ) : (data.summary ?? []).map((s) => (
                    <tr key={s.numberPlate}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{s.numberPlate}</td>
                      <td><span className="audit-log-type-badge">{s.type}</span></td>
                      <td style={{ fontSize: '.8125rem', color: 'var(--sidebar-text-dim)' }}>{s.totalAudits}</td>
                      <td style={{ minWidth: 160 }}><ScoreBar score={s.avgScore} /></td>
                      <td>
                        {s.needAction > 0 ? (
                          <span className="audit-log-nc-badge">{s.needAction}</span>
                        ) : (
                          <span style={{ color: 'var(--slate-200)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {s.closed > 0 ? (
                          <span className="audit-log-status-badge status-CLOSED">{s.closed}</span>
                        ) : (
                          <span style={{ color: 'var(--slate-200)' }}>0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Fleet summary mobile cards */}
            <div className="d-md-none" style={{ padding: '0.75rem' }}>
              {(data.summary ?? []).length === 0 ? (
                <div className="audit-log-empty">
                  No data for selected filters. Adjust dates or filters and click Apply.
                </div>
              ) : (
                <ul className="audit-log-card-list" style={{ padding: 0 }}>
                  {(data.summary ?? []).map((s) => (
                    <li key={s.numberPlate} className="audit-log-card">
                      <div className="audit-log-card-top">
                        <span className="audit-log-card-plate">{s.numberPlate}</span>
                        <span className="audit-log-type-badge">{s.type}</span>
                      </div>
                      <div className="audit-log-card-meta">
                        <span>{s.totalAudits} audits</span>
                        <span className={`audit-log-compliance ${s.avgScore >= 80 ? 'high' : s.avgScore >= 50 ? 'mid' : 'low'}`}>
                          {s.avgScore}% avg
                        </span>
                      </div>
                      <div className="audit-log-card-stats">
                        {s.needAction > 0 && <span className="audit-log-nc-badge">{s.needAction} need action</span>}
                        {s.closed > 0 && <span className="audit-log-status-badge status-CLOSED">{s.closed} closed</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Audit Records — same layout as Audit Log: table on desktop, cards on mobile */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--primary-dark)' }}>Audit Records</h5>
            <span className="badge bg-secondary" style={{ fontSize: '.8rem' }}>{(data.audits ?? []).length} records</span>
          </div>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <div className="d-none d-md-block" style={{ overflowX: 'auto' }}>
              <table className="table qr-table mb-0" style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ambulance</th>
                    <th>Type</th>
                    <th>EMT</th>
                    <th>Compliance</th>
                    <th>NC</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(data.audits ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--sidebar-text-dim)', padding: '2rem' }}>
                        No audit records match the filters.
                      </td>
                    </tr>
                  ) : (data.audits ?? []).slice(0, 100).map((a) => (
                    <tr key={a._id}>
                      <td style={{ fontSize: '.8125rem', color: 'var(--sidebar-text-dim)', whiteSpace: 'nowrap' }}>
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{a.ambulanceNumberPlate}</td>
                      <td><span className="audit-log-type-badge">{a.ambulanceType}</span></td>
                      <td style={{ fontSize: '.8125rem', color: 'var(--sidebar-text-dim)' }}>{a.emtUserId?.name ?? '—'}</td>
                      <td>
                        <span className={`audit-log-compliance ${a.complianceScore >= 80 ? 'high' : a.complianceScore >= 50 ? 'mid' : 'low'}`}>
                          {a.complianceScore}%
                        </span>
                      </td>
                      <td>
                        {a.nonComplianceCount > 0 ? (
                          <span className="audit-log-nc-badge">{a.nonComplianceCount}</span>
                        ) : (
                          <span style={{ color: 'var(--slate-200)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`audit-log-status-badge status-${a.status}`}>
                          {statusLabel(a.status)}
                        </span>
                      </td>
                      <td>
                        <Link to={`/audits/${a._id}`} className="audit-log-view-btn">View</Link>
                      </td>
                    </tr>
                  ))}
                  {(data.audits ?? []).length > 100 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', fontSize: '.8125rem', color: 'var(--sidebar-text-dim)', padding: '.75rem' }}>
                        Showing first 100 of {(data.audits ?? []).length} records. Download Excel for full data.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {/* Mobile: card list like Audit Log */}
            <div className="d-md-none">
              {(data.audits ?? []).length === 0 ? (
                <div className="audit-log-empty" style={{ padding: '1.5rem' }}>
                  No audit records match the filters.
                </div>
              ) : (
                <ul className="audit-log-card-list">
                  {(data.audits ?? []).slice(0, 100).map((a) => (
                    <li key={a._id} className="audit-log-card">
                      <div className="audit-log-card-top">
                        <span className="audit-log-card-plate">{a.ambulanceNumberPlate}</span>
                        <span className={`audit-log-status-badge status-${a.status}`}>
                          {statusLabel(a.status)}
                        </span>
                      </div>
                      <div className="audit-log-card-meta">
                        <span>{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}</span>
                        <span className="audit-log-type-badge">{a.ambulanceType}</span>
                        {a.emtUserId?.name && <span className="audit-log-card-emt">{a.emtUserId.name}</span>}
                      </div>
                      <div className="audit-log-card-stats">
                        <span className={`audit-log-compliance ${a.complianceScore >= 80 ? 'high' : a.complianceScore >= 50 ? 'mid' : 'low'}`}>
                          {a.complianceScore}%
                        </span>
                        {a.nonComplianceCount > 0 && (
                          <span className="audit-log-nc-badge">{a.nonComplianceCount} NC</span>
                        )}
                      </div>
                      <Link to={`/audits/${a._id}`} className="audit-log-card-view">
                        View details →
                      </Link>
                    </li>
                  ))}
                  {(data.audits ?? []).length > 100 && (
                    <li style={{ textAlign: 'center', fontSize: '.8125rem', color: 'var(--sidebar-text-dim)', padding: '.75rem', listStyle: 'none' }}>
                      Showing first 100. Download Excel for full data.
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
