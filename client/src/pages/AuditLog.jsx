import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

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

  const hasFilters = filter.status || filter.numberPlate || filter.from || filter.to;
  const clearFilters = () => {
    setPage(1);
    setFilter({ status: '', numberPlate: '', from: '', to: '' });
  };

  return (
    <div className="page-shell">
      <div className="page-banner audit-log-banner">
        <div className="audit-log-banner-inner">
          <h2 className="audit-log-banner-title">Audit Log</h2>
          <p className="audit-log-banner-subtitle">
            {total} total record{total !== 1 ? 's' : ''}
          </p>
        </div>
        {hasRole('EMT') && (
          <Link to="/scan" className="btn-hero audit-log-new-btn">
            🚑 New Audit
          </Link>
        )}
      </div>

      {error && <div className="alert alert-danger rounded-lg mb-4">{error}</div>}

      <div style={{
        background: 'var(--card-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        {/* Filter row — stacked on mobile, row on desktop */}
        <div className="audit-log-filters">
          <div className="audit-log-filters-grid">
            <div className="audit-log-filter-field">
              <label className="audit-log-filter-label">Number plate</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. BLS-001"
                value={filter.numberPlate}
                onChange={(e) => setF('numberPlate', e.target.value)}
              />
            </div>
            <div className="audit-log-filter-field">
              <label className="audit-log-filter-label">Status</label>
              <select
                className="form-select form-select-sm"
                value={filter.status}
                onChange={(e) => setF('status', e.target.value)}
              >
                <option value="">All</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="NEED_ACTION">Need action</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="audit-log-filter-field">
              <label className="audit-log-filter-label">From date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filter.from}
                onChange={(e) => setF('from', e.target.value)}
              />
            </div>
            <div className="audit-log-filter-field">
              <label className="audit-log-filter-label">To date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filter.to}
                onChange={(e) => setF('to', e.target.value)}
              />
            </div>
            {hasFilters && (
              <button type="button" className="audit-log-clear-btn" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="audit-log-loading"><Spinner /></div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="audit-log-table-wrap d-none d-md-block">
              <div style={{ overflowX: 'auto' }}>
                <table className="table qr-table mb-0" style={{ minWidth: 640 }}>
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
                        <td colSpan={hasRole('EMT') ? 7 : 8} style={{ textAlign: 'center', color: 'var(--sidebar-text-dim)', padding: '2rem' }}>
                          No audits found.
                          {hasRole('EMT') && (
                            <> <Link to="/scan" style={{ color: 'var(--primary)' }}>Start your first audit →</Link></>
                          )}
                        </td>
                      </tr>
                    ) : audits.map((a) => (
                      <tr key={a._id}>
                        <td style={{ fontSize: '.8125rem', color: 'var(--sidebar-text-dim)', whiteSpace: 'nowrap' }}>
                          {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{a.ambulanceNumberPlate}</td>
                        <td>
                          <span className="audit-log-type-badge">{a.ambulanceType}</span>
                        </td>
                        {!hasRole('EMT') && (
                          <td style={{ fontSize: '.8125rem', color: 'var(--sidebar-text-dim)' }}>{a.emtUserId?.name ?? '—'}</td>
                        )}
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
                            {a.status === 'NEED_ACTION' ? 'Need action' : a.status === 'CLOSED' ? 'Closed' : 'Submitted'}
                          </span>
                        </td>
                        <td>
                          <Link to={`/audits/${a._id}`} className="audit-log-view-btn">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: card list */}
            <div className="audit-log-cards d-md-none">
              {audits.length === 0 ? (
                <div className="audit-log-empty">
                  No audits found.
                  {hasRole('EMT') && (
                    <> <Link to="/scan" className="audit-log-empty-link">Start your first audit →</Link></>
                  )}
                </div>
              ) : (
                <ul className="audit-log-card-list">
                  {audits.map((a) => (
                    <li key={a._id} className="audit-log-card">
                      <div className="audit-log-card-top">
                        <span className="audit-log-card-plate">{a.ambulanceNumberPlate}</span>
                        <span className={`audit-log-status-badge status-${a.status}`}>
                          {a.status === 'NEED_ACTION' ? 'Need action' : a.status === 'CLOSED' ? 'Closed' : 'Submitted'}
                        </span>
                      </div>
                      <div className="audit-log-card-meta">
                        <span>{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}</span>
                        <span className="audit-log-type-badge">{a.ambulanceType}</span>
                        {!hasRole('EMT') && a.emtUserId?.name && (
                          <span className="audit-log-card-emt">{a.emtUserId.name}</span>
                        )}
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
                </ul>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="audit-log-pagination">
                <span className="audit-log-pagination-info">
                  Page {page} of {totalPages} · {total} records
                </span>
                <nav className="audit-log-pagination-nav">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(1)}
                    className="audit-log-page-btn"
                    aria-label="First page"
                  >«</button>
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="audit-log-page-btn"
                    aria-label="Previous page"
                  >‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                    const p = start + i;
                    if (p > totalPages) return null;
                    const active = p === page;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`audit-log-page-btn audit-log-page-num ${active ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="audit-log-page-btn"
                    aria-label="Next page"
                  >›</button>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage(totalPages)}
                    className="audit-log-page-btn"
                    aria-label="Last page"
                  >»</button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
