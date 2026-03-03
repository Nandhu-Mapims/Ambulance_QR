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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="admin-qr-modal-backdrop"
      onClick={onClose}
    >
      <div className="admin-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h5 id="qr-modal-title" style={{ fontWeight: 700, marginBottom: '.35rem', color: 'var(--primary-dark)' }}>QR Code</h5>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', background: 'var(--primary-dark)', color: '#fff', padding: '.25rem .6rem', borderRadius: 'var(--radius-sm)' }}>
              {ambulance.numberPlate}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1, padding: '.25rem' }}>×</button>
        </div>

        <div className="qr-print-frame">
          <img src={qrBase64} alt={`QR code for ${ambulance.numberPlate}`} style={{ width: 200, height: 200 }} />
        </div>

        <div className="admin-qr-modal-actions">
          <a href={qrBase64} download={`qr-${ambulance.numberPlate}.png`} className="admin-qr-modal-download">
            ⬇️ Download
          </a>
          <button type="button" onClick={handlePrint} className="btn-hero admin-qr-modal-print">
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Table row (list view) ───────────────────────────────────────────────────── */
function AmbulanceRow({ amb, onRotate, onToggle, onViewQR, rotating }) {
  const color = TYPE_COLOR[amb.type] ?? '#64748b';
  const lastRotated = amb.lastQrRotatedAt ? new Date(amb.lastQrRotatedAt).toLocaleDateString('en-GB') : '—';
  return (
    <tr className={!amb.isActive ? 'opacity-75' : ''} style={{ transition: 'var(--transition)' }}>
      <td style={{ padding: '.75rem 1rem', verticalAlign: 'middle' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '.875rem', letterSpacing: '.04em',
          background: 'var(--primary-dark)', color: '#fff', padding: '.25rem .6rem', borderRadius: 'var(--radius-sm)',
        }}>
          {amb.numberPlate}
        </span>
      </td>
      <td style={{ padding: '.75rem 1rem', verticalAlign: 'middle' }}>
        <span style={{
          background: `${color}18`, color, borderRadius: 99, padding: '.2rem .6rem',
          fontSize: '.75rem', fontWeight: 700,
        }}>
          {TYPE_ICON[amb.type]} {amb.type}
        </span>
      </td>
      <td style={{ padding: '.75rem 1rem', verticalAlign: 'middle', color: 'var(--sidebar-text-dim)', fontSize: '.875rem' }}>
        {amb.station ?? '—'}
      </td>
      <td style={{ padding: '.75rem 1rem', verticalAlign: 'middle' }}>
        <span
          role="status"
          aria-label={amb.isActive ? 'Active' : 'Inactive'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.8125rem', fontWeight: 600,
          }}
        >
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: amb.isActive ? '#16a34a' : '#94a3b8',
            boxShadow: amb.isActive ? '0 0 0 2px rgba(22,163,74,.25)' : 'none',
          }} />
          {amb.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td style={{ padding: '.75rem 1rem', verticalAlign: 'middle', fontSize: '.8125rem', color: 'var(--sidebar-text-dim)' }}>
        {lastRotated}
      </td>
      <td style={{ padding: '.75rem 1rem', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onViewQR(amb)}
            aria-label={`View QR code for ${amb.numberPlate}`}
            style={{
              padding: '.4rem .6rem', borderRadius: 'var(--radius-sm)', fontSize: '.75rem', fontWeight: 600,
              border: `1px solid ${color}66`, background: `${color}12`, color, cursor: 'pointer', transition: 'var(--transition)',
            }}
          >
            📱 QR
          </button>
          <button
            type="button"
            onClick={() => onRotate(amb)}
            disabled={rotating === amb._id}
            aria-label={`Rotate QR for ${amb.numberPlate}`}
            style={{
              padding: '.4rem .6rem', borderRadius: 'var(--radius-sm)', fontSize: '.75rem', fontWeight: 600,
              border: '1px solid var(--card-border)', background: 'var(--slate-50)', color: 'var(--sidebar-text-dim)',
              cursor: rotating === amb._id ? 'wait' : 'pointer', transition: 'var(--transition)',
            }}
          >
            {rotating === amb._id ? <span className="spinner-border spinner-border-sm" /> : '🔄 Rotate'}
          </button>
          <button
            type="button"
            onClick={() => onToggle(amb)}
            aria-label={amb.isActive ? `Deactivate ${amb.numberPlate}` : `Activate ${amb.numberPlate}`}
            style={{
              padding: '.4rem .6rem', borderRadius: 'var(--radius-sm)', fontSize: '.75rem', fontWeight: 600,
              border: `1px solid ${amb.isActive ? '#fca5a5' : '#86efac'}`,
              background: amb.isActive ? '#fef2f2' : '#f0fdf4',
              color: amb.isActive ? '#dc2626' : '#16a34a',
              cursor: 'pointer', transition: 'var(--transition)',
            }}
          >
            {amb.isActive ? '⏸ Deactivate' : '▶ Activate'}
          </button>
        </div>
      </td>
    </tr>
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

  const isEmptyFiltered = filtered.length === 0 && ambulances.length > 0;

  return (
    <div className="page-shell admin-page admin-ambulance">
      <div className="admin-banner">
        <div className="admin-banner-inner">
          <h2 className="admin-banner-title">Ambulance Master</h2>
          <p className="admin-banner-subtitle">
            {activeCount} active · {ambulances.length - activeCount} inactive · {ambulances.length} total
          </p>
        </div>
        <button type="button" className="btn-hero admin-banner-cta" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '✕ Cancel' : '+ Register Ambulance'}
        </button>
      </div>

      {error && <div className="alert alert-danger rounded-lg mb-4">{error}</div>}

      {showForm && (
        <div className="admin-form-card">
          <h5 className="admin-form-title">Register New Ambulance</h5>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="row g-2 admin-form-row">
              {[
                { label: 'Number Plate', name: 'numberPlate', placeholder: 'AMB-001', isUpper: true },
                { label: 'Station', name: 'station', placeholder: 'e.g. HQ' },
              ].map((f) => (
                <div key={f.name} className="col-12 col-md-4">
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
              <div className="col-12 col-md-4">
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
              <button type="submit" className="btn-hero admin-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : '🚑 Register & Generate QR'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-filter-bar">
        <span className="admin-filter-label">Filter:</span>
        <div className="admin-filter-pills">
          {['', 'BLS', 'ALS', 'ICU', 'NEONATAL', 'TRANSPORT'].map((t) => {
            const isActive = typeFilter === t;
            const pillColor = TYPE_COLOR[t] ?? '#0369a1';
            return (
              <button
                key={t || 'all'}
                type="button"
                onClick={() => setTypeFilter(t)}
                aria-pressed={isActive}
                aria-label={t ? `Show ${t} ambulances` : 'Show all ambulances'}
                className="admin-filter-pill"
                style={{
                  borderColor: isActive ? pillColor : undefined,
                  background: isActive ? (t ? `${pillColor}18` : 'var(--primary-light)') : 'var(--card-bg)',
                  color: isActive ? (t ? pillColor : 'var(--primary-dark)') : 'var(--sidebar-text-dim)',
                }}
              >
                {t ? `${TYPE_ICON[t]} ${t}` : '🔷 All'}
              </button>
            );
          })}
        </div>
        <span className="admin-filter-count">{filtered.length} ambulance{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <Spinner /> : (
        filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚑</div>
            {isEmptyFiltered ? (
              <>
                <p>No ambulances in {typeFilter}.</p>
                <button type="button" className="btn-hero" style={{ marginTop: '.75rem' }} onClick={() => setTypeFilter('')}>
                  Show all
                </button>
              </>
            ) : (
              <p>No ambulances found. Register one above.</p>
            )}
          </div>
        ) : (
          <>
            <div className="admin-table-card d-none d-md-block">
            <div className="admin-table-wrap">
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="table qr-table mb-0" style={{ minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th>Plate</th>
                      <th>Type</th>
                      <th>Station</th>
                      <th>Status</th>
                      <th>QR last rotated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: 'none' }}>
                    {filtered.map((amb) => (
                      <AmbulanceRow
                        key={amb._id}
                        amb={amb}
                        onRotate={handleRotate}
                        onToggle={handleToggle}
                        onViewQR={handleViewQR}
                        rotating={rotating}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
            <div className="admin-table-card d-md-none">
            <ul className="admin-card-list">
              {filtered.map((amb) => {
                const color = TYPE_COLOR[amb.type] ?? '#64748b';
                const lastRotated = amb.lastQrRotatedAt ? new Date(amb.lastQrRotatedAt).toLocaleDateString('en-GB') : '—';
                return (
                  <li key={amb._id} className={`admin-card ${!amb.isActive ? 'admin-card--inactive' : ''}`}>
                    <div className="admin-card-top">
                      <span className="admin-card-plate">{amb.numberPlate}</span>
                      <span className="admin-card-type" style={{ background: `${color}18`, color }}>
                        {TYPE_ICON[amb.type]} {amb.type}
                      </span>
                    </div>
                    <div className="admin-card-meta">
                      <span>📍 {amb.station ?? '—'}</span>
                      <span>{lastRotated}</span>
                      <span className="admin-card-status" aria-label={amb.isActive ? 'Active' : 'Inactive'}>
                        <span style={{ background: amb.isActive ? '#16a34a' : '#94a3b8' }} className="admin-card-status-dot" />
                        {amb.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="admin-card-actions">
                      <button type="button" className="admin-card-btn admin-card-btn--qr" onClick={() => handleViewQR(amb)}>📱 QR</button>
                      <button type="button" className="admin-card-btn" onClick={() => handleRotate(amb)} disabled={rotating === amb._id}>
                        {rotating === amb._id ? <span className="spinner-border spinner-border-sm" /> : '🔄 Rotate'}
                      </button>
                      <button type="button" className="admin-card-btn admin-card-btn--toggle" onClick={() => handleToggle(amb)}>
                        {amb.isActive ? '⏸ Deactivate' : '▶ Activate'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            </div>
          </>
        )
      )}

      {qrModal && <QRModal ambulance={qrModal.ambulance} qrBase64={qrModal.qrBase64} onClose={() => setQrModal(null)} />}
    </div>
  );
}
