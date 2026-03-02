import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';

const uploadFile = async (file) => {
  const fd = new FormData();
  fd.append('evidence', file);
  const { data } = await api.post('/uploads/evidence', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
};

export default function CloseAction() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [action, setAction] = useState(null);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState({});
  const [evidenceUrls, setEvidenceUrls] = useState({});

  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    Promise.all([
      api.get(`/actions/audit/${auditId}`),
      api.get(`/audits/${auditId}`),
    ])
      .then(([actRes, audRes]) => {
        setAction(actRes.data.action);
        setAudit(audRes.data.audit);
      })
      .catch((e) => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [auditId]);

  const handleUpload = async (key, file) => {
    if (!file) return;
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      const url = await uploadFile(file);
      setEvidenceUrls((u) => ({ ...u, [key]: url }));
      toast('Evidence uploaded', 'success');
    } catch {
      toast('Upload failed. Please retry.', 'error');
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  };

  const onSubmit = async (formData) => {
    try {
      const issues = action.issues
        .filter((i) => i.status === 'OPEN')
        .map((issue) => ({
          key: issue.key,
          actionText: formData[`action_${issue.key}`] || '',
          evidenceUrl: evidenceUrls[issue.key] || null,
        }));

      const { data } = await api.put(`/actions/${auditId}/close`, { issues });

      if (data.fullyResolved) {
        toast('All issues resolved. Audit marked CLOSED.', 'success');
        navigate('/supervisor/actions');
      } else {
        toast('Issues updated. Some issues still open.', 'info');
        setAction(data.action);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Close failed';
      setError(msg);
      toast(msg, 'error');
    }
  };

  if (loading) return <Spinner />;
  if (!action) return <div className="alert alert-danger">{error || 'Action not found'}</div>;

  const openIssues = action.issues.filter((i) => i.status === 'OPEN');
  const closedIssues = action.issues.filter((i) => i.status === 'CLOSED');

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex align-items-center gap-3 mb-4">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>← Back</button>
            <h3 className="fw-bold mb-0">Close Corrective Action</h3>
          </div>

          {/* Audit summary */}
          {audit && (
            <div className="card border-danger border-2 mb-4">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold text-danger mb-0">{audit.ambulanceNumberPlate}</h5>
                  <span className="badge bg-dark me-2">{audit.ambulanceType}</span>
                  <span className="text-muted small">
                    Submitted: {audit.submittedAt ? new Date(audit.submittedAt).toLocaleString() : '—'}
                  </span>
                </div>
                <div className="text-end">
                  <div className="fw-bold fs-4 text-danger">{audit.complianceScore}%</div>
                  <div className="small text-muted">compliance</div>
                </div>
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Open issues */}
            {openIssues.length > 0 && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white fw-bold d-flex justify-content-between">
                  <span>Open Issues ({openIssues.length})</span>
                  <span className="badge bg-danger">{openIssues.length} remaining</span>
                </div>
                <div className="card-body">
                  {openIssues.map((issue) => (
                    <div key={issue.key} className="border-bottom pb-3 mb-3">
                      <div className="d-flex gap-2 mb-2">
                        <span className="badge bg-warning text-dark">OPEN</span>
                        <strong className="small">{issue.issueText}</strong>
                      </div>
                      <div className="mb-2">
                        <label className="form-label small fw-semibold">Corrective Action Taken <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          placeholder="Describe action taken…"
                          {...register(`action_${issue.key}`, { required: true })}
                        />
                      </div>
                      <div>
                        <label className="form-label small fw-semibold">Evidence Photo (optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control form-control-sm"
                          onChange={(e) => handleUpload(issue.key, e.target.files[0])}
                          disabled={uploading[issue.key]}
                        />
                        {uploading[issue.key] && <div className="form-text">Uploading…</div>}
                        {evidenceUrls[issue.key] && (
                          <div className="form-text text-success">✓ Evidence uploaded</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Already closed */}
            {closedIssues.length > 0 && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white fw-bold text-success">
                  Resolved Issues ({closedIssues.length})
                </div>
                <div className="card-body">
                  {closedIssues.map((issue) => (
                    <div key={issue.key} className="d-flex gap-2 mb-2">
                      <span className="badge bg-success">CLOSED</span>
                      <span className="small">{issue.issueText}</span>
                      {issue.actionText && <span className="small text-muted">— {issue.actionText}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {openIssues.length > 0 && (
              <button type="submit" className="btn btn-warning fw-semibold px-5" disabled={isSubmitting}>
                {isSubmitting && <span className="spinner-border spinner-border-sm me-2" />}
                Submit Resolutions
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
