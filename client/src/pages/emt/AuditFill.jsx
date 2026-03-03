import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';

/* ── file upload helper ───────────────────────────────────────────────────── */
const uploadFile = async (file) => {
  const fd = new FormData();
  fd.append('evidence', file);
  const { data } = await api.post('/uploads/evidence', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
};

/* ── Evidence upload sub-component ───────────────────────────────────────── */
function EvidenceField({ questionKey, value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch {
      alert('Upload failed. Please retry.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2 p-2 bg-danger bg-opacity-10 rounded border border-danger border-opacity-25">
      <label className="form-label text-danger small fw-semibold mb-1">
        Evidence mandatory for NO answer
      </label>
      <input
        type="file"
        accept="image/*"
        className="form-control form-control-sm"
        onChange={handleFile}
        disabled={uploading}
      />
      {uploading && <div className="form-text text-muted mt-1">⏳ Uploading…</div>}
      {value && !uploading && (
        <div className="form-text text-success mt-1 fw-semibold">✅ Evidence uploaded</div>
      )}
    </div>
  );
}

/* ── Question renderer ────────────────────────────────────────────────────── */
function QuestionField({ q, register, control, setValue, index }) {
  const responseValue = useWatch({ control, name: `resp_${q.key}` });
  const evidenceValue = useWatch({ control, name: `ev_${q.key}` });

  const showEvidence =
    q.type === 'YESNO' && q.requiresEvidenceIfNo && responseValue === 'NO';

  const isAnswered = responseValue !== undefined && responseValue !== '' && responseValue !== null;
  const isNonCompliant = q.type === 'YESNO' && responseValue === 'NO';

  return (
    <div className={`card mb-3 border-0 ${isNonCompliant ? 'bg-danger bg-opacity-10 border-start border-danger border-3' : 'bg-light'}`}>
      <div className="card-body py-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <p className="fw-semibold mb-0 small">
            <span className="text-muted me-2">#{index + 1}</span>
            {q.required && <span className="text-danger me-1">*</span>}
            {q.label}
          </p>
          {isAnswered && (
            <span className="badge bg-success bg-opacity-75 ms-2 flex-shrink-0">✓</span>
          )}
        </div>

        {q.type === 'YESNO' && (
          <div className="btn-group audit-yesno-group w-100" role="group">
            {['YES', 'NO'].map((opt) => (
              <label
                key={opt}
                className={`btn btn-sm px-4 ${
                  responseValue === opt
                    ? opt === 'YES' ? 'btn-success' : 'btn-danger'
                    : 'btn-outline-secondary'
                }`}
              >
                <input
                  type="radio"
                  className="btn-check"
                  value={opt}
                  {...register(`resp_${q.key}`)}
                />
                {opt === 'YES' ? '✓ YES' : '✗ NO'}
              </label>
            ))}
          </div>
        )}

        {q.type === 'TEXT' && (
          <input type="text" className="form-control" placeholder="Enter text…" {...register(`resp_${q.key}`)} />
        )}

        {q.type === 'NUMBER' && (
          <input type="number" className="form-control" style={{ maxWidth: 160 }} {...register(`resp_${q.key}`)} />
        )}

        {q.type === 'DATE' && (
          <input type="date" className="form-control" style={{ maxWidth: 200 }} {...register(`resp_${q.key}`)} />
        )}

        {q.type === 'DROPDOWN' && (
          <select className="form-select" style={{ maxWidth: 280 }} {...register(`resp_${q.key}`)}>
            <option value="">— select —</option>
            {q.options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}

        {q.type === 'PHOTO' && (
          <EvidenceField
            questionKey={q.key}
            value={evidenceValue}
            onChange={(url) => setValue(`ev_${q.key}`, url)}
          />
        )}

        {showEvidence && (
          <EvidenceField
            questionKey={q.key}
            value={evidenceValue}
            onChange={(url) => setValue(`ev_${q.key}`, url)}
          />
        )}
      </div>
    </div>
  );
}

/* ── Progress bar ─────────────────────────────────────────────────────────── */
function ProgressBar({ answered, total }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const color = pct === 100 ? 'success' : pct >= 50 ? 'warning' : 'danger';
  return (
    <div>
      <div className="d-flex justify-content-between small text-muted mb-1">
        <span>{answered} / {total} answered</span>
        <span>{pct}%</span>
      </div>
      <div className="progress" style={{ height: 6 }}>
        <div
          className={`progress-bar bg-${color}`}
          style={{ width: `${pct}%`, transition: 'width 0.3s ease' }}
        />
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function AuditFill() {
  const { numberPlate } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');
  const navigate = useNavigate();
  const toast = useToast();

  const [resolveData, setResolveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, control, setValue, watch } = useForm();

  useEffect(() => {
    const params = token ? { t: token } : {};
    api.get(`/audit/resolve/${encodeURIComponent(numberPlate)}`, { params })
      .then(({ data }) => setResolveData(data))
      .catch((e) => setError(e.response?.data?.message || 'Invalid or expired QR code.'))
      .finally(() => setLoading(false));
  }, [numberPlate, token]);

  // Count answered required questions for progress bar
  const allValues = watch();
  const answeredCount = useMemo(() => {
    if (!resolveData) return 0;
    return resolveData.template.questions
      .filter((q) => q.required)
      .filter((q) => {
        const v = allValues[`resp_${q.key}`];
        return v !== undefined && v !== '' && v !== null;
      }).length;
  }, [allValues, resolveData]);

  const requiredTotal = resolveData?.template.questions.filter((q) => q.required).length ?? 0;

  const handleCancel = () => {
    if (answeredCount > 0) {
      if (!window.confirm('You have answered questions. Cancel and lose all progress?')) return;
    }
    navigate(-1);
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      const { template, ambulance } = resolveData;

      const responses = template.questions.map((q) => ({
        key: q.key,
        value: formData[`resp_${q.key}`] ?? null,
        evidenceUrl: formData[`ev_${q.key}`] || null,
      }));

      const { data } = await api.post('/audits', {
        ambulanceNumberPlate: ambulance.numberPlate,
        templateId: template._id,
        tripMeta: {
          patientId: formData.patientId || '',
          tripType: formData.tripType || 'EMERGENCY',
          from: formData.from || '',
          to: formData.to || '',
        },
        responses,
      });

      toast('Audit submitted successfully!', 'success');
      navigate('/audit-success', { state: { audit: data.audit } });
    } catch (e) {
      const msg =
        e.response?.data?.errors?.map((x) => x.message).join('; ') ||
        e.response?.data?.message ||
        'Submission failed';
      setError(msg);
      toast(msg, 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner text="Loading checklist…" />;
  if (error && !resolveData) {
    return (
      <div className="container">
        <div className="alert alert-danger mt-4">
          <strong>❌ {error}</strong>
          <div className="mt-2">
            <button className="btn btn-sm btn-outline-danger" onClick={() => navigate('/scan')}>
              ← Back to Scan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { ambulance, template } = resolveData;
  const sorted = [...template.questions].sort((a, b) => a.order - b.order);

  return (
    <div className="container audit-fill-wrap px-2 px-md-3">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">

          {/* ── Sticky ambulance + progress banner ── */}
          <div
            className="card border-danger border-2 mb-4 shadow-sm audit-fill-sticky"
            style={{ position: 'sticky', top: 60, zIndex: 100, background: '#fff' }}
          >
            <div className="card-body py-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-danger fs-5">{ambulance.numberPlate}</span>
                  <span className="badge bg-dark">{ambulance.type}</span>
                  {ambulance.station && (
                    <span className="text-muted small">📍 {ambulance.station}</span>
                  )}
                </div>
                <span className="text-muted small">{template.name} v{template.version}</span>
              </div>
              <ProgressBar answered={answeredCount} total={requiredTotal} />
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Trip metadata */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white fw-bold border-bottom">
                📋 Trip Information
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Patient ID</label>
                    <input type="text" className="form-control" {...register('patientId')} placeholder="e.g. PT-20240101" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Trip Type</label>
                    <select className="form-select" {...register('tripType')}>
                      <option value="EMERGENCY">🚨 Emergency</option>
                      <option value="TRANSFER">🔄 Transfer</option>
                      <option value="ROUTINE">📋 Routine</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">From (origin)</label>
                    <input type="text" className="form-control" {...register('from')} placeholder="Origin location" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">To (destination)</label>
                    <input type="text" className="form-control" {...register('to')} placeholder="Destination" />
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white d-flex justify-content-between align-items-center border-bottom">
                <span className="fw-bold">Checklist ({sorted.length} questions)</span>
                <span className="badge bg-danger">
                  {sorted.filter((q) => q.required).length} mandatory
                </span>
              </div>
              <div className="card-body">
                {sorted.map((q, idx) => (
                  <QuestionField
                    key={q.key}
                    q={q}
                    register={register}
                    control={control}
                    setValue={setValue}
                    index={idx}
                  />
                ))}
              </div>
            </div>

            <div className="d-flex gap-3 pb-5 audit-fill-actions flex-wrap">
              <button
                type="submit"
                className="btn btn-danger px-5 fw-bold py-2"
                disabled={submitting}
              >
                {submitting
                  ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</>
                  : '✅ Submit Audit'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
