import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';

const TYPE_COLOR = { BLS: '#2563eb', ALS: '#7c3aed', ICU: '#dc2626', NEONATAL: '#d97706', TRANSPORT: '#059669' };
const TYPE_ICON  = { BLS: '🚑', ALS: '🚨', ICU: '🏥', NEONATAL: '👶', TRANSPORT: '🚐' };

const schema = z.object({
  numberPlate: z.string().min(1, 'Required'),
  type: z.enum(['BLS', 'ALS', 'ICU', 'NEONATAL', 'TRANSPORT'], { required_error: 'Required' }),
  station: z.string().optional(),
  isActive: z.boolean().optional(),
});

/* ── QR Print Modal ─────────────────────────────────────────────────────────── */
function QRModal({ ambulance, qrBase64, onClose }) {
  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>QR — ${ambulance.numberPlate}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; text-align: center; padding: 40px; background: #fff; }
        .plate { font-family: monospace; font-size: 2rem; font-weight: 900; letter-spacing: .1em;
                 background: #1a1a2e; color: #fff; padding: .5rem 1.5rem; border-radius: 8px;
                 display: inline-block; margin-bottom: 8px; box-shadow: 3px 3px 0 #dc2626; }
        .badge { display: inline-block; background: ${TYPE_COLOR[ambulance.type]}22; color: ${TYPE_COLOR[ambulance.type]};
                 border-radius: 99px; padding: .2rem .8rem; font-size: .85rem; font-weight: 700; margin: 4px; }
        img { border: 3px solid #1a1a2e; border-radius: 12px; margin: 20px auto; display: block; }
        .hint { font-size: .75rem; color: #aaa; margin-top: 8px; }
      </style></head><body>
        <div class="plate">${ambulance.numberPlate}</div><br/>
        <span class="badge">${TYPE_ICON[ambulance.type]} ${ambulance.type}</span>
        ${ambulance.station ? `<span class="badge">📍 ${ambulance.station}</span>` : ''}
        <img src="${qrBase64}" style="width:220px"/>
        <p class="hint">Scan to start ambulance audit</p>
      </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', maxWidth: 340, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h5 style={{ fontWeight: 900, marginBottom: '.25rem' }}>QR Code</h5>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', background: '#1a1a2e', color: '#fff', padding: '.2rem .6rem', borderRadius: 6, boxShadow: '2px 2px 0 #dc2626' }}>
              {ambulance.numberPlate}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
        </div>

        <div className="qr-print-frame">
          <img src={qrBase64} alt="QR Code" style={{ width: 200, height: 200 }} />
        </div>

        <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem' }}>
          <a href={qrBase64} download={`qr-${ambulance.numberPlate}.png`}
            style={{ flex: 1, textAlign: 'center', padding: '.6rem', border: '1.5px solid #e5e7eb', borderRadius: 10, color: '#374151', fontWeight: 600, fontSize: '.875rem', textDecoration: 'none', transition: 'all .2s' }}
            onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            ⬇️ Download
          </a>
          <button onClick={handlePrint} className="btn-hero" style={{ flex: 1, fontSize: '.875rem' }}>
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Ambulance card ──────────────────────────────────────────────────────────── */
function AmbulanceCard({ amb, onRotate, onToggle, onViewQR, rotating }) {
  const color = TYPE_COLOR[amb.type] || '#6b7280';
  return (
    <div className={`ambulance-card anim-fade-up ${!amb.isActive ? 'opacity-50' : ''}`}
      style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #e8edf3', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      {/* Accent bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      <div style={{ padding: '1rem 1.1rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', letterSpacing: '.06em',
              background: '#0f172a', color: '#fff', display: 'inline-block', padding: '.2rem .65rem',
              borderRadius: 6, boxShadow: `2px 2px 0 ${color}`, marginBottom: '.4rem',
            }}>
              {amb.numberPlate}
            </div>
            <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                background: `${color}18`, color, borderRadius: 99,
                padding: '.18rem .65rem', fontSize: '12px', fontWeight: 700, letterSpacing: '.04em',
              }}>
                {TYPE_ICON[amb.type]} {amb.type}
              </span>
              {amb.station && (
                <span style={{
                  background: '#f1f5f9', color: '#475569', borderRadius: 99,
                  padding: '.18rem .6rem', fontSize: '12px', fontWeight: 600,
                }}>
                  📍 {amb.station}
                </span>
              )}
            </div>
          </div>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: amb.isActive ? '#16a34a' : '#9ca3af',
            display: 'inline-block',
            boxShadow: amb.isActive ? '0 0 0 3px #bbf7d0' : 'none',
            marginTop: '.3rem',
          }} title={amb.isActive ? 'Active' : 'Inactive'} />
        </div>

        {/* QR info */}
        <div style={{
          background: '#f8fafc', borderRadius: 7, padding: '.45rem .75rem',
          marginBottom: '.75rem', fontSize: '12px', color: '#64748b',
          border: '1px solid #f1f5f9',
        }}>
          🔄 QR last rotated: <strong style={{ color: '#475569' }}>
            {amb.lastQrRotatedAt ? new Date(amb.lastQrRotatedAt).toLocaleDateString('en-GB') : '—'}
          </strong>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '.4rem' }}>
          <button
            onClick={() => onViewQR(amb)}
            style={{
              flex: 1, padding: '.38rem .5rem', borderRadius: 7,
              border: `1px solid ${color}55`,
              background: `${color}0e`, color, fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${color}20`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${color}0e`; }}
          >
            📱 QR
          </button>
          <button
            onClick={() => onRotate(amb)}
            disabled={rotating === amb._id}
            style={{
              flex: 1, padding: '.38rem .5rem', borderRadius: 7,
              border: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#374151', fontWeight: 600, fontSize: '13px',
              cursor: rotating === amb._id ? 'wait' : 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={(e) => { if (rotating !== amb._id) e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
          >
            {rotating === amb._id ? <span className="spinner-border spinner-border-sm" /> : '🔄 Rotate'}
          </button>
          <button
            onClick={() => onToggle(amb)}
            style={{
              flex: 1, padding: '.38rem .5rem', borderRadius: 7,
              border: `1px solid ${amb.isActive ? '#fca5a5' : '#86efac'}`,
              background: amb.isActive ? '#fff5f5' : '#f0fdf4',
              color: amb.isActive ? '#dc2626' : '#16a34a',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all .15s',
            }}
          >
            {amb.isActive ? '⏸ Deactivate' : '▶ Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────────── */
export default function AmbulanceMaster() {
  const toast = useToast();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [rotating, setRotating] = useState(null);
  const [qrCache, setQrCache] = useState({});    // numberPlate → base64
  const [typeFilter, setTypeFilter] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  const fetchAmbulances = () =>
    api.get('/ambulances')
      .then(({ data }) => setAmbulances(data.ambulances))
      .catch((e) => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchAmbulances(); }, []);

  const onSubmit = async (data) => {
    try {
      const { data: res } = await api.post('/ambulances', data);
      setAmbulances((prev) => [res.ambulance, ...prev]);
      setQrCache((c) => ({ ...c, [res.ambulance.numberPlate]: res.qrBase64 }));
      setQrModal({ ambulance: res.ambulance, qrBase64: res.qrBase64 });
      toast(`${res.ambulance.numberPlate} registered`, 'success');
      reset(); setShowForm(false);
    } catch (e) {
      const msg = e.response?.data?.message || 'Create failed';
      setError(msg); toast(msg, 'error');
    }
  };

  const handleRotate = async (amb) => {
    if (!window.confirm(`Rotate QR for ${amb.numberPlate}? The old QR sticker will stop working.`)) return;
    setRotating(amb._id);
    try {
      const { data } = await api.post(`/ambulances/${amb._id}/rotate-qr`);
      setQrCache((c) => ({ ...c, [amb.numberPlate]: data.qrBase64 }));
      setQrModal({ ambulance: amb, qrBase64: data.qrBase64 });
      toast(`QR rotated for ${amb.numberPlate}`, 'success');
    } catch (e) { toast(e.response?.data?.message || 'Rotation failed', 'error'); }
    finally { setRotating(null); }
  };

  const handleToggle = async (amb) => {
    try {
      const { data } = await api.put(`/ambulances/${amb._id}`, { isActive: !amb.isActive });
      setAmbulances((prev) => prev.map((a) => (a._id === amb._id ? data.ambulance : a)));
      toast(`${amb.numberPlate} ${amb.isActive ? 'deactivated' : 'activated'}`, 'info');
    } catch (e) { toast(e.response?.data?.message || 'Update failed', 'error'); }
  };

  const handleViewQR = async (amb) => {
    // Use cached QR or re-generate via rotate if missing
    if (qrCache[amb.numberPlate]) {
      setQrModal({ ambulance: amb, qrBase64: qrCache[amb.numberPlate] });
    } else {
      // No QR in cache, rotate to generate one
      setRotating(amb._id);
      try {
        const { data } = await api.post(`/ambulances/${amb._id}/rotate-qr`);
        setQrCache((c) => ({ ...c, [amb.numberPlate]: data.qrBase64 }));
        setQrModal({ ambulance: amb, qrBase64: data.qrBase64 });
        toast(`QR generated for ${amb.numberPlate}`, 'info');
      } catch (e) { toast('Could not load QR', 'error'); }
      finally { setRotating(null); }
    }
  };

  const filtered = typeFilter ? ambulances.filter((a) => a.type === typeFilter) : ambulances;
  const activeCount = ambulances.filter((a) => a.isActive).length;

  return (
    <div className="page-shell">
      {/* ── Page heading row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.85rem' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', marginBottom: '.1rem' }}>Ambulance Master</h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            {activeCount} active · {ambulances.length - activeCount} inactive · {ambulances.length} total
          </p>
        </div>
        <button
          className="btn-hero"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? '✕ Cancel' : '+ Register Ambulance'}
        </button>
      </div>

      {error && <div className="alert alert-danger rounded-lg mb-4">{error}</div>}

      {/* Register form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 8, padding: '1rem 1.1rem', marginBottom: '.85rem', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <h5 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '1rem', color: '#0f172a' }}>Register New Ambulance</h5>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="row g-2">
              {[
                { label: 'Number Plate', name: 'numberPlate', placeholder: 'AMB-001', isUpper: true },
                { label: 'Station', name: 'station', placeholder: 'e.g. HQ' },
              ].map((f) => (
                <div key={f.name} className="col-md-4">
                  <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '.3rem', display: 'block', color: '#374151' }}>
                    {f.label} {f.name === 'numberPlate' && <span style={{ color: '#dc2626' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    className={`form-control form-control-sm ${errors[f.name] ? 'is-invalid' : ''}`}
                    style={{ textTransform: f.isUpper ? 'uppercase' : undefined, fontSize: '14px' }}
                    {...register(f.name)}
                    placeholder={f.placeholder}
                  />
                  {errors[f.name] && <div className="invalid-feedback" style={{ fontSize: '12px' }}>{errors[f.name].message}</div>}
                </div>
              ))}
              <div className="col-md-4">
                <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '.3rem', display: 'block', color: '#374151' }}>
                  Type <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select className={`form-select form-select-sm ${errors.type ? 'is-invalid' : ''}`} style={{ fontSize: '14px' }} {...register('type')}>
                  <option value="">Select type…</option>
                  {['BLS', 'ALS', 'ICU', 'NEONATAL', 'TRANSPORT'].map((t) => (
                    <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>
                  ))}
                </select>
                {errors.type && <div className="invalid-feedback" style={{ fontSize: '12px' }}>{errors.type.message}</div>}
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className="btn-hero" disabled={isSubmitting}>
                {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : '🚑 Register & Generate QR'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '.85rem' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8', marginRight: '.25rem' }}>
          Filter:
        </span>
        {['', 'BLS', 'ALS', 'ICU', 'NEONATAL', 'TRANSPORT'].map((t) => (
          <button
            key={t || 'all'}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: '.28rem .8rem', borderRadius: 99, fontSize: '13px', fontWeight: 600,
              border: '1px solid',
              borderColor: typeFilter === t ? (TYPE_COLOR[t] || '#4f46e5') : '#e2e8f0',
              background: typeFilter === t ? (TYPE_COLOR[t] ? `${TYPE_COLOR[t]}15` : '#eef2ff') : '#fff',
              color: typeFilter === t ? (TYPE_COLOR[t] || '#4f46e5') : '#64748b',
              cursor: 'pointer', transition: 'all .15s',
            }}
          >
            {t ? `${TYPE_ICON[t]} ${t}` : '🔷 All'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
          {filtered.length} ambulance{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? <Spinner /> : (
        filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚑</div>
            <p>No ambulances found. Register one above.</p>
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map((amb, i) => (
              <div key={amb._id} className={`col-md-6 col-lg-4 anim-fade-up anim-delay-${Math.min(i + 1, 5)}`}>
                <AmbulanceCard
                  amb={amb}
                  onRotate={handleRotate}
                  onToggle={handleToggle}
                  onViewQR={handleViewQR}
                  rotating={rotating}
                />
              </div>
            ))}
          </div>
        )
      )}

      {qrModal && <QRModal ambulance={qrModal.ambulance} qrBase64={qrModal.qrBase64} onClose={() => setQrModal(null)} />}
    </div>
  );
}
