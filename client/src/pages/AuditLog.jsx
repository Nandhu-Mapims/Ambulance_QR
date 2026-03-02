import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = { SUBMITTED: 'info', NEED_ACTION: 'warning', CLOSED: 'success' };
const PAGE_SIZE = 20;

export default function AuditLog() {
  const { hasRole } = useAuth();
  const [audits, setAudits] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', numberPlate: '', from: '', to: '' });

  const fetchAudits = useCallback(() => {
    const params = { page, limit: PAGE_SIZE };
    if (filter.status)      params.status      = filter.status;
    if (filter.numberPlate) params.numberPlate = filter.numberPlate;
    if (filter.from)        params.from        = filter.from;
    if (filter.to)          params.to          = filter.to;

    setLoading(true);
    api.get('/audits', { params })
      .then(({ data }) => {
        setAudits(data.audits || []);
        setTotal(data.total || 0);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load audits'))
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  const setF = (key, value) => {
    setPage(1);   // reset to first page on filter change
    setFilter((f) => ({ ...f, [key]: value }));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-shell">
      <div className="page-banner anim-fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="section-label mb-1" style={{ color: 'rgba(255,255,255,.7)' }}>Records</p>
            <h2 style={{ fontWeight: 900, letterSpacing: '-.04em' }}>Audit Log</h2>
            <p style={{ margin: 0, opacity: .85, fontSize: '.9rem' }}>{total} total record{total !== 1 ? 's' : ''}</p>
          </div>
          {hasRole('EMT') && (
            <Link to="/scan" className="btn-hero" style={{ textDecoration: 'none', background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.35)', boxShadow: 'none' }}>
              🚑 New Audit
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar mb-4">
        <div className="card-body py-0 px-0">
          <div className="row g-2 align-items-end">
            <div className="col-sm-3">
              <label className="form-label small fw-semibold mb-1">Number Plate</label>
              <input
                type="text"
                className="form-control form-control-sm text-uppercase"
                placeholder="e.g. AMB-001"
                value={filter.numberPlate}
                onChange={(e) => setF('numberPlate', e.target.value)}
              />
            </div>
            <div className="col-sm-2">
              <label className="form-label small fw-semibold mb-1">Status</label>
              <select className="form-select form-select-sm" value={filter.status} onChange={(e) => setF('status', e.target.value)}>
                <option value="">All</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="NEED_ACTION">NEED ACTION</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div className="col-sm-2">
              <label className="form-label small fw-semibold mb-1">From Date</label>
              <input type="date" className="form-control form-control-sm" value={filter.from} onChange={(e) => setF('from', e.target.value)} />
            </div>
            <div className="col-sm-2">
              <label className="form-label small fw-semibold mb-1">To Date</label>
              <input type="date" className="form-control form-control-sm" value={filter.to} onChange={(e) => setF('to', e.target.value)} />
            </div>
            <div className="col-sm-3 d-flex gap-2">
              <button
                type="button"
                className="btn-pill-clear w-100"
                onClick={() => { setPage(1); setFilter({ status: '', numberPlate: '', from: '', to: '' }); }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger rounded-lg">{error}</div>}

      {loading ? <Spinner /> : (
        <>
          <div className="table-responsive qr-table rounded-lg">
            <table className="table table-hover align-middle mb-0 qr-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ambulance</th>
                  <th>Type</th>
                  {!hasRole('EMT') && <th>EMT</th>}
                  <th>Compliance</th>
                  <th>NC</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={hasRole('EMT') ? 7 : 8} className="text-center text-muted py-5">
                      No audits found.
                      {hasRole('EMT') && (
                        <span> <Link to="/scan" className="text-danger">Start your first audit →</Link></span>
                      )}
                    </td>
                  </tr>
                ) : audits.map((a) => (
                  <tr key={a._id}>
                    <td className="small text-muted text-nowrap">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="fw-semibold">{a.ambulanceNumberPlate}</td>
                    <td><span className="badge bg-dark">{a.ambulanceType}</span></td>
                    {!hasRole('EMT') && <td className="small">{a.emtUserId?.name || '—'}</td>}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-shrink-0" style={{ width: 52, height: 6 }}>
                          <div
                            className={`progress-bar bg-${a.complianceScore >= 80 ? 'success' : a.complianceScore >= 50 ? 'warning' : 'danger'}`}
                            style={{ width: `${a.complianceScore}%` }}
                          />
                        </div>
                        <small className="text-muted">{a.complianceScore}%</small>
                      </div>
                    </td>
                    <td className="text-center">
                      {a.nonComplianceCount > 0
                        ? <span className="badge bg-danger">{a.nonComplianceCount}</span>
                        : <span className="text-muted small">—</span>}
                    </td>
                    <td>
                      <span className={`badge bg-${STATUS_COLOR[a.status] || 'secondary'} text-dark`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/audits/${a._id}`}
                        className="btn-pill-primary"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">
                Page {page} of {totalPages} &nbsp;·&nbsp; {total} records
              </small>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(1)}>«</button>
                  </li>
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage((p) => p - 1)}>‹</button>
                  </li>

                  {/* Page number pills */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                    const p = start + i;
                    return p <= totalPages ? (
                      <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                      </li>
                    ) : null;
                  })}

                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage((p) => p + 1)}>›</button>
                  </li>
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(totalPages)}>»</button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
