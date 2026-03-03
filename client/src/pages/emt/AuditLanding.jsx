/**
 * /audit/:numberPlate  — the URL encoded into every printed QR code.
 *
 * When an EMT scans a QR code this page:
 *  1. Reads numberPlate from URL params and t= from query string.
 *  2. Calls the public resolve API to validate the token.
 *  3. Displays ambulance info + template summary.
 *  4. "Start Audit" navigates to the fill page (token already in URL).
 *
 * If the user is not logged in they are redirected to /login with a
 * returnTo param so they come back here after authenticating.
 */
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';

export default function AuditLanding() {
  const { numberPlate } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);       // { ambulance, template }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect to login if unauthenticated, preserving the QR URL
  useEffect(() => {
    if (!user) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?returnTo=${returnTo}`, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    const params = token ? { t: token } : {};
    api.get(`/audit/resolve/${encodeURIComponent(numberPlate)}`, { params })
      .then(({ data: res }) => setData(res))
      .catch((e) => setError(e.response?.data?.message || 'Ambulance not found or QR code invalid.'))
      .finally(() => setLoading(false));
  }, [numberPlate, token, user]);

  if (!user) return null;
  if (loading) return <Spinner text="Validating QR code…" />;

  if (error) {
    return (
      <div className="row justify-content-center mt-5">
        <div className="col-md-6 text-center">
          <div style={{ fontSize: '4rem' }}>❌</div>
          <h3 className="text-danger mt-3">Invalid QR Code</h3>
          <p className="text-muted">{error}</p>
          <p className="small text-muted">The QR token may have been rotated by an administrator.</p>
          <Link to="/scan" className="btn btn-outline-danger mt-2">Manually Enter Details</Link>
        </div>
      </div>
    );
  }

  const { ambulance, template } = data;
  const yesnoCount = template.questions.filter((q) => q.type === 'YESNO').length;
  const requiredCount = template.questions.filter((q) => q.required).length;

  const fillUrl = token
    ? `/audit/${encodeURIComponent(numberPlate)}/fill?t=${token}`
    : `/audit/${encodeURIComponent(numberPlate)}/fill`;

  return (
    <div className="row justify-content-center audit-landing-wrap">
      <div className="col-12 col-md-7 col-lg-5 px-2 px-md-3">

        {/* Ambulance card */}
        <div className="card border-danger border-3 shadow mb-4">
          <div className="card-body text-center py-4">
            <div style={{ fontSize: '3rem' }}>🚑</div>
            <h2 className="fw-bold text-danger mt-2 mb-1">{ambulance.numberPlate}</h2>
            <div className="d-flex justify-content-center gap-2 mb-3">
              <span className="badge bg-dark fs-6">{ambulance.type}</span>
              {ambulance.station && (
                <span className="badge bg-secondary fs-6">📍 {ambulance.station}</span>
              )}
              <span className={`badge bg-${ambulance.isActive ? 'success' : 'danger'} fs-6`}>
                {ambulance.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-muted small mb-0">
              QR last rotated: {ambulance.lastQrRotatedAt
                ? new Date(ambulance.lastQrRotatedAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Checklist summary */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">📋 {template.name}</h5>
            <div className="row g-2 text-center">
              {[
                { label: 'Questions', value: template.questions.length, color: 'primary' },
                { label: 'Required', value: requiredCount, color: 'danger' },
                { label: 'Yes/No', value: yesnoCount, color: 'warning' },
              ].map((s) => (
                <div key={s.label} className="col-4">
                  <div className={`border border-${s.color} rounded p-2`}>
                    <div className={`fw-bold fs-4 text-${s.color}`}>{s.value}</div>
                    <div className="small text-muted">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-muted small mt-3 mb-0">
              Template version {template.version}
            </p>
          </div>
        </div>

        {/* Role check — only EMT can submit */}
        {user.role !== 'EMT' ? (
          <div className="alert alert-info text-center">
            <strong>{user.role}</strong> — view only. Only EMT users can submit audits.
          </div>
        ) : (
          <Link
            to={fillUrl}
            className="btn btn-danger w-100 py-3 fw-bold fs-5 shadow"
          >
            Start Audit →
          </Link>
        )}

        <div className="text-center mt-3">
          <Link to="/audits" className="text-muted small">View Audit Log</Link>
        </div>
      </div>
    </div>
  );
}
