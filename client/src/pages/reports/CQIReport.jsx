import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';

const STATUS_COLOR = { SUBMITTED: 'info', NEED_ACTION: 'warning', CLOSED: 'success' };
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

/* ── Inline compliance bar ────────────────────────────────────────────────── */
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
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-sm-3">
              <label className="form-label small fw-semibold mb-1">From Date</label>
              <input type="date" className="form-control form-control-sm" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} />
            </div>
            <div className="col-sm-3">
              <label className="form-label small fw-semibold mb-1">To Date</label>
              <input type="date" className="form-control form-control-sm" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} />
            </div>
            <div className="col-sm-3">
              <label className="form-label small fw-semibold mb-1">Number Plate</label>
              <input type="text" className="form-control form-control-sm text-uppercase" value={filters.numberPlate} onChange={(e) => setFilter('numberPlate', e.target.value)} placeholder="All" />
            </div>
            <div className="col-sm-2">
              <label className="form-label small fw-semibold mb-1">Status</label>
              <select className="form-select form-select-sm" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                <option value="">All</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="NEED_ACTION">NEED ACTION</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div className="col-sm-1">
              <button className="btn btn-danger btn-sm w-100" onClick={fetchReport} disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Go'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stat cards */}
      {stats && (
        <div className="row g-3 mb-4">
          <StatCard icon="📋" label="Total Audits" value={stats.total} color="primary" />
          <StatCard icon="📊" label="Avg Compliance" value={`${stats.avgScore}%`} color={stats.avgScore >= 80 ? 'success' : stats.avgScore >= 50 ? 'warning' : 'danger'} sub="across all audits" />
          <StatCard icon="⚠️" label="Need Action" value={stats.needAction} color="warning" sub="open issues" />
          <StatCard icon="✅" label="Resolved" value={stats.closed} color="success" sub="fully closed" />
        </div>
      )}

      {loading && <Spinner text="Generating report…" />}

      {data && !loading && (
        <>
          {/* Fleet summary table */}
          <h5 className="fw-bold mb-3">Fleet Summary</h5>
          <div className="table-responsive mb-5 shadow-sm rounded">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-dark">
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
                  <tr><td colSpan={6} className="text-center text-muted py-4">No data for selected filters</td></tr>
                ) : (data.summary ?? []).map((s) => (
                  <tr key={s.numberPlate}>
                    <td className="fw-bold">{s.numberPlate}</td>
                    <td><span className="badge bg-dark">{s.type}</span></td>
                    <td className="text-center">{s.totalAudits}</td>
                    <td style={{ minWidth: 160 }}><ScoreBar score={s.avgScore} /></td>
                    <td className="text-center">
                      {s.needAction > 0 ? <span className="badge bg-warning text-dark">{s.needAction}</span> : <span className="text-muted">0</span>}
                    </td>
                    <td className="text-center">
                      {s.closed > 0 ? <span className="badge bg-success">{s.closed}</span> : <span className="text-muted">0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit detail table */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Audit Records</h5>
            <span className="badge bg-secondary">{(data.audits ?? []).length} records</span>
          </div>
          <div className="table-responsive shadow-sm rounded">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-secondary">
                <tr>
                  <th>Date</th><th>Plate</th><th>Type</th><th>EMT</th>
                  <th>Compliance</th><th>NC</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {(data.audits ?? []).slice(0, 100).map((a) => (
                  <tr key={a._id}>
                    <td className="small text-muted text-nowrap">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="fw-semibold">{a.ambulanceNumberPlate}</td>
                    <td><span className="badge bg-dark">{a.ambulanceType}</span></td>
                    <td className="small">{a.emtUserId?.name || '—'}</td>
                    <td style={{ minWidth: 120 }}><ScoreBar score={a.complianceScore} /></td>
                    <td className="text-center">
                      {a.nonComplianceCount > 0 ? <span className="badge bg-danger">{a.nonComplianceCount}</span> : '—'}
                    </td>
                    <td>
                      <span className={`badge bg-${STATUS_COLOR[a.status] || 'secondary'} text-dark`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/audits/${a._id}`} className="btn btn-xs btn-outline-secondary btn-sm small py-0 px-2">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {data.audits.length > 100 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted small py-2">
                      Showing first 100 of {data.audits.length} records. Download Excel for full data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
