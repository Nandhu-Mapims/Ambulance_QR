import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';

/** Returns a human-readable "X days ago" string. */
function ageLabel(dateStr) {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function ageBadgeColor(dateStr) {
  if (!dateStr) return 'secondary';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days >= 7) return 'danger';
  if (days >= 3) return 'warning';
  return 'info';
}

export default function OpenIssues() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('date');  // 'date' | 'compliance' | 'issues'

  const fetchActions = useCallback(() => {
    setLoading(true);
    api.get('/actions/open')
      .then(({ data }) => setActions(data.actions))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  const sorted = [...actions].sort((a, b) => {
    if (sort === 'compliance') {
      return (a.tripAuditId?.complianceScore ?? 100) - (b.tripAuditId?.complianceScore ?? 100);
    }
    if (sort === 'issues') {
      const aOpen = a.issues.filter((i) => i.status === 'OPEN').length;
      const bOpen = b.issues.filter((i) => i.status === 'OPEN').length;
      return bOpen - aOpen;
    }
    // Default: oldest first (most urgent)
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return (
    <div className="page-shell">
      <div className="page-banner anim-fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="section-label mb-1" style={{ color: 'rgba(255,255,255,.7)' }}>Supervisor</p>
            <h2 style={{ fontWeight: 900, letterSpacing: '-.04em' }}>Corrective Actions</h2>
            <p style={{ margin: 0, opacity: .85, fontSize: '.9rem' }}>
              {actions.length > 0 ? `${actions.length} pending resolution` : 'All issues resolved'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-select form-select-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 8, width: 'auto' }}
            >
              <option value="date" style={{ color: '#000' }}>Sort: Oldest first</option>
              <option value="compliance" style={{ color: '#000' }}>Sort: Lowest compliance</option>
              <option value="issues" style={{ color: '#000' }}>Sort: Most issues</option>
            </select>
            <button
              onClick={fetchActions}
              disabled={loading}
              style={{ background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 8, padding: '.4rem .75rem', cursor: 'pointer', fontSize: '.85rem' }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? <Spinner /> : (
        <>
          {sorted.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '4rem' }}>✅</div>
              <h5 className="mt-3 text-success">All Clear!</h5>
              <p className="text-muted">No open corrective actions. Keep up the good work!</p>
            </div>
          ) : (
            <div className="row g-3">
              {sorted.map((action) => {
                const audit = action.tripAuditId;
                const openIssues = action.issues.filter((i) => i.status === 'OPEN');
                const openCount = openIssues.length;
                const ageColor = ageBadgeColor(action.createdAt);

                return (
                  <div key={action._id} className="col-lg-6">
                    <div className={`card border-0 shadow-sm h-100 border-start border-4 border-${ageColor}`}>
                      <div className="card-body">
                        {/* Header row */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="fw-bold mb-1 text-danger">{audit?.ambulanceNumberPlate}</h5>
                            <div className="d-flex gap-1 flex-wrap">
                              <span className="badge bg-dark">{audit?.ambulanceType}</span>
                              <span className="badge bg-danger">{openCount} issue{openCount !== 1 ? 's' : ''}</span>
                              <span className={`badge bg-${ageColor} text-dark`}>
                                {ageLabel(action.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className={`fw-bold fs-4 text-${audit?.complianceScore >= 80 ? 'success' : audit?.complianceScore >= 50 ? 'warning' : 'danger'}`}>
                              {audit?.complianceScore}%
                            </div>
                            <div className="small text-muted">compliance</div>
                          </div>
                        </div>

                        {/* EMT info */}
                        <p className="text-muted small mb-2">
                          EMT: <strong>{audit?.emtUserId?.name || '—'}</strong>
                          &nbsp;·&nbsp;
                          {audit?.submittedAt ? new Date(audit.submittedAt).toLocaleDateString() : '—'}
                        </p>

                        {/* Issue list preview */}
                        <div className="mb-3">
                          {openIssues.slice(0, 3).map((issue) => (
                            <div key={issue.key} className="d-flex align-items-start gap-2 mb-1">
                              <span className="badge bg-warning text-dark flex-shrink-0">OPEN</span>
                              <span className="small text-truncate">{issue.issueText}</span>
                            </div>
                          ))}
                          {openCount > 3 && (
                            <span className="small text-muted">+{openCount - 3} more issue{openCount - 3 !== 1 ? 's' : ''}…</span>
                          )}
                        </div>

                        <div className="d-flex gap-2">
                          <Link
                            to={`/supervisor/actions/${audit?._id}`}
                            className="btn btn-warning btn-sm fw-semibold"
                          >
                            ⚠️ Resolve Issues
                          </Link>
                          <Link
                            to={`/audits/${audit?._id}`}
                            className="btn btn-outline-secondary btn-sm"
                          >
                            View Audit
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
