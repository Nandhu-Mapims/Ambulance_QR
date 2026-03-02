/**
 * Shown after an EMT successfully submits an audit.
 * Receives the audit result via React Router location.state.
 */
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const STATUS_LABEL = {
  SUBMITTED: { icon: '✅', text: 'Submitted — No issues found', color: 'success' },
  NEED_ACTION: { icon: '⚠️', text: 'Needs Corrective Action', color: 'warning' },
};

export default function AuditSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Guard: if accessed directly without state, redirect away
  useEffect(() => {
    if (!state?.audit) navigate('/audits', { replace: true });
  }, [state, navigate]);

  if (!state?.audit) return null;

  const { audit } = state;
  const status = STATUS_LABEL[audit.status] || STATUS_LABEL.SUBMITTED;
  const isNeedAction = audit.status === 'NEED_ACTION';

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-md-6 col-lg-5">

        {/* Hero card */}
        <div className={`card border-${status.color} border-3 shadow mb-4 text-center`}>
          <div className="card-body py-5">
            <div style={{ fontSize: '4rem' }}>{status.icon}</div>
            <h2 className="fw-bold mt-3 mb-1">Audit Submitted!</h2>
            <p className={`text-${status.color} fw-semibold`}>{status.text}</p>

            {/* Compliance donut — simple visual */}
            <div className="my-4 position-relative d-inline-flex align-items-center justify-content-center">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e9ecef" strokeWidth="14" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={audit.complianceScore >= 80 ? '#198754' : audit.complianceScore >= 50 ? '#ffc107' : '#dc3545'}
                  strokeWidth="14"
                  strokeDasharray={`${(audit.complianceScore / 100) * 314} 314`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize="22" fontWeight="bold" fill="#212529">
                  {audit.complianceScore}%
                </text>
              </svg>
            </div>

            <p className="text-muted small mb-0">Compliance Score</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="row g-3 mb-4">
          <div className="col-4 text-center">
            <div className="card border-0 bg-light h-100">
              <div className="card-body py-3">
                <div className="fw-bold fs-3 text-primary">{audit.responses?.length ?? '—'}</div>
                <div className="small text-muted">Answers</div>
              </div>
            </div>
          </div>
          <div className="col-4 text-center">
            <div className="card border-0 bg-light h-100">
              <div className="card-body py-3">
                <div className={`fw-bold fs-3 text-${audit.nonComplianceCount > 0 ? 'danger' : 'success'}`}>
                  {audit.nonComplianceCount}
                </div>
                <div className="small text-muted">Non-Compliant</div>
              </div>
            </div>
          </div>
          <div className="col-4 text-center">
            <div className="card border-0 bg-light h-100">
              <div className="card-body py-3">
                <span className={`badge bg-${status.color} text-${isNeedAction ? 'dark' : 'white'} fs-6`}>
                  {audit.status}
                </span>
                <div className="small text-muted mt-1">Status</div>
              </div>
            </div>
          </div>
        </div>

        {isNeedAction && (
          <div className="alert alert-warning small">
            <strong>⚠️ Corrective action required.</strong> A supervisor has been notified and will review the non-compliant items.
          </div>
        )}

        {/* CTA buttons */}
        <div className="d-grid gap-2">
          <Link to="/scan" className="btn btn-danger btn-lg fw-semibold">
            🚑 Start Another Audit
          </Link>
          <Link to="/audits" className="btn btn-outline-secondary">
            View Audit Log
          </Link>
        </div>
      </div>
    </div>
  );
}
