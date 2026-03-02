/**
 * /audits/:id — Full detail view of a single audit.
 * Shows: ambulance info, trip meta, all responses with labels,
 *        compliance summary, and corrective action (if any).
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = { SUBMITTED: 'info', NEED_ACTION: 'warning', CLOSED: 'success' };
const VALUE_COLOR = { YES: 'success', NO: 'danger' };

function ResponseRow({ question, response }) {
  const val = response?.value;
  const isYesNo = question?.type === 'YESNO';
  const isNo = isYesNo && val === 'NO';

  return (
    <tr className={isNo ? 'table-danger' : ''}>
      <td className="small text-muted align-top" style={{ width: 28 }}>{question?.order != null ? question.order + 1 : '—'}</td>
      <td className="small align-top">{question?.label ?? response?.key}</td>
      <td className="align-top">
        {isYesNo ? (
          <span className={`badge bg-${val === 'YES' ? 'success' : val === 'NO' ? 'danger' : 'secondary'}`}>
            {val ?? '—'}
          </span>
        ) : (
          <span className="small">{val ?? <span className="text-muted">—</span>}</span>
        )}
      </td>
      <td className="align-top">
        {response?.evidenceUrl && (
          <a href={`http://localhost:5000${response.evidenceUrl}`} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-secondary btn-sm small py-0 px-2">
            📎 Evidence
          </a>
        )}
      </td>
    </tr>
  );
}

export default function AuditDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [audit, setAudit] = useState(null);
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/audits/${id}`)
      .then(({ data }) => {
        setAudit(data.audit);
        setAction(data.correctiveAction);
      })
      .catch((e) => setError(e.response?.data?.message || 'Audit not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner text="Loading audit…" />;
  if (error)   return <div className="container"><div className="alert alert-danger mt-4">{error}</div></div>;

  const template = audit.templateId;
  const questionMap = Object.fromEntries((template?.questions ?? []).map((q) => [q.key, q]));
  const status = audit.status;

  return (
    <div className="page-shell">
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>← Back</button>
        <h3 className="fw-bold mb-0">Audit Detail</h3>
        <span className={`badge bg-${STATUS_COLOR[status] || 'secondary'} text-dark ms-auto fs-6`}>
          {status}
        </span>
      </div>

      <div className="row g-4">
        {/* ── Left column ── */}
        <div className="col-lg-4">
          {/* Ambulance / audit meta */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-danger text-white fw-bold">Ambulance</div>
            <div className="card-body">
              <h4 className="fw-bold text-danger">{audit.ambulanceNumberPlate}</h4>
              <span className="badge bg-dark me-2">{audit.ambulanceType}</span>
              <hr />
              <dl className="row mb-0 small">
                <dt className="col-5 text-muted">EMT</dt>
                <dd className="col-7">{audit.emtUserId?.name ?? '—'}</dd>
                <dt className="col-5 text-muted">Submitted</dt>
                <dd className="col-7">{audit.submittedAt ? new Date(audit.submittedAt).toLocaleString() : '—'}</dd>
                <dt className="col-5 text-muted">Template</dt>
                <dd className="col-7">{template?.name ?? '—'} v{template?.version}</dd>
              </dl>
            </div>
          </div>

          {/* Trip meta */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-bold">Trip Info</div>
            <div className="card-body">
              <dl className="row mb-0 small">
                <dt className="col-5 text-muted">Patient ID</dt>
                <dd className="col-7">{audit.tripMeta?.patientId || '—'}</dd>
                <dt className="col-5 text-muted">Trip Type</dt>
                <dd className="col-7">{audit.tripMeta?.tripType || '—'}</dd>
                <dt className="col-5 text-muted">From</dt>
                <dd className="col-7">{audit.tripMeta?.from || '—'}</dd>
                <dt className="col-5 text-muted">To</dt>
                <dd className="col-7">{audit.tripMeta?.to || '—'}</dd>
              </dl>
            </div>
          </div>

          {/* Compliance summary */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-bold">Compliance</div>
            <div className="card-body text-center">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e9ecef" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={audit.complianceScore >= 80 ? '#198754' : audit.complianceScore >= 50 ? '#ffc107' : '#dc3545'}
                  strokeWidth="12"
                  strokeDasharray={`${(audit.complianceScore / 100) * 251} 251`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize="18" fontWeight="bold">
                  {audit.complianceScore}%
                </text>
              </svg>
              <div className="mt-2 small text-muted">
                {audit.nonComplianceCount} non-compliant item{audit.nonComplianceCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Supervisor action */}
          {hasRole('SUPERVISOR', 'ADMIN') && status === 'NEED_ACTION' && (
            <Link to={`/supervisor/actions/${audit._id}`} className="btn btn-warning w-100 fw-semibold">
              ⚠️ Resolve Corrective Action
            </Link>
          )}
        </div>

        {/* ── Right column: responses ── */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <span className="fw-bold">Checklist Responses ({audit.responses.length})</span>
              {audit.nonComplianceCount > 0 && (
                <span className="badge bg-danger">{audit.nonComplianceCount} NO answers</span>
              )}
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th><th>Question</th><th>Answer</th><th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {(audit.responses ?? []).map((r) => (
                    <ResponseRow
                      key={r.key}
                      question={questionMap[r.key]}
                      response={r}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Corrective action details */}
          {action && (
            <div className="card border-0 shadow-sm">
              <div className={`card-header fw-bold ${action.closedAt ? 'bg-success text-white' : 'bg-warning'}`}>
                Corrective Action — {action.closedAt ? '✅ Resolved' : '⚠️ Pending'}
              </div>
              <div className="card-body">
                {(action.issues ?? []).map((issue) => (
                  <div key={issue.key} className="border-bottom pb-3 mb-3">
                    <div className="d-flex gap-2 mb-1">
                      <span className={`badge bg-${issue.status === 'CLOSED' ? 'success' : 'danger'}`}>
                        {issue.status}
                      </span>
                      <strong className="small">{issue.issueText}</strong>
                    </div>
                    {issue.actionText && (
                      <p className="small text-muted mb-1">Action: {issue.actionText}</p>
                    )}
                    {issue.evidenceUrl && (
                      <a href={`http://localhost:5000${issue.evidenceUrl}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary btn-xs">
                        📎 Evidence
                      </a>
                    )}
                  </div>
                ))}
                {action.closedBy && (
                  <p className="small text-muted mb-0">
                    Closed by <strong>{action.closedBy.name}</strong> on {new Date(action.closedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
