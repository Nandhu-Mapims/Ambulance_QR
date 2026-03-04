/**
 * EMT Scan page: open camera to scan ambulance QR, or enter number plate manually.
 * QR codes encode the audit fill URL (e.g. /audit/:numberPlate/fill?t=token).
 * Manual entry navigates to /audit/:numberPlate; AuditLanding resolves token or prompts.
 *
 * Set HIDE_SCAN_AND_MANUAL_ENTRY to true to show a placeholder only (scan QR and manual
 * entry UI hidden so you can change this page later).
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Html5Qrcode } from 'html5-qrcode';

/** Set to true to hide Scan QR and Manual Entry; show placeholder only. Set to false to restore. */
const HIDE_SCAN_AND_MANUAL_ENTRY = true;

const SCANNER_ELEMENT_ID = 'audit-scan-reader';
const SCANNER_QRBOX = { width: 260, height: 260 };
const RECENT_PLATES_MAX = 5;

const schema = z.object({
  numberPlate: z.string().min(2, 'Enter a valid number plate'),
});

/** Parse scanned QR content (full URL or path) into app path + search for navigation. */
function getAuditPathFromScanned(decodedText) {
  const raw = (decodedText ?? '').trim();
  if (!raw) return null;
  try {
    if (raw.startsWith('/')) return raw;
    const url = new URL(raw);
    return url.pathname + url.search;
  } catch {
    return raw.startsWith('/') ? raw : `/audit/${encodeURIComponent(raw)}`;
  }
}

export default function AuditScan() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [recent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentPlates') ?? '[]'); }
    catch { return []; }
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!isScanning) return;
    setScanError(null);
    scannedRef.current = false;

    let cancelled = false;
    const config = { fps: 10, qrbox: SCANNER_QRBOX };
    const onSuccess = (decodedText) => {
      if (scannedRef.current) return;
      const path = getAuditPathFromScanned(decodedText);
      if (!path || !path.includes('/audit/')) return;
      scannedRef.current = true;
      scannerRef.current?.stop().catch(() => {}).finally(() => {
        scannerRef.current = null;
        setIsScanning(false);
        navigate(path);
      });
    };
    const onFailure = () => {};

    const startCamera = () => {
      if (cancelled) return;
      const element = document.getElementById(SCANNER_ELEMENT_ID);
      if (!element) {
        setScanError('Scanner element not ready. Please try again.');
        setIsScanning(false);
        return;
      }
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      const tryStart = (facingMode) =>
        scanner.start(
          { facingMode },
          config,
          onSuccess,
          onFailure
        );

      tryStart('environment')
        .catch(() => (cancelled ? null : tryStart('user')))
        .catch((err) => {
          if (cancelled) return;
          const msg = err?.message ?? 'Could not access camera.';
          const secure = typeof window !== 'undefined' && !window.isSecureContext;
          const hint = secure
            ? ' Use HTTPS or localhost and allow camera permission.'
            : ' Allow camera permission for this site or use manual entry below.';
          setScanError(msg + hint);
          setIsScanning(false);
          scannerRef.current = null;
        });
    };

    const timer = setTimeout(startCamera, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [isScanning, navigate]);

  const handleCloseScanner = () => {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setIsScanning(false);
    setScanError(null);
  };

  const onSubmit = ({ numberPlate }) => {
    const plate = numberPlate.trim().toUpperCase();
    const updated = [plate, ...recent.filter((p) => p !== plate)].slice(0, RECENT_PLATES_MAX);
    try { localStorage.setItem('recentPlates', JSON.stringify(updated)); } catch { /* ignore */ }
    navigate(`/audit/${encodeURIComponent(plate)}`);
  };

  if (HIDE_SCAN_AND_MANUAL_ENTRY) {
    return (
      <div className="row justify-content-center mt-4 audit-scan-wrap">
        <div className="col-12 col-md-6 col-lg-4 px-2 px-md-3">
          <div className="text-center">
            <div style={{ fontSize: '3rem' }}>📷</div>
            <h3 className="fw-bold mt-3">Start Audit</h3>
            <p className="text-muted mt-2 mb-0" style={{ fontSize: '1rem' }}>
              Please scan the QR code on the ambulance to fill the audit form.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center mt-4 audit-scan-wrap">
      <div className="col-12 col-md-6 col-lg-4 px-2 px-md-3">
        <div className="text-center mb-5">
          <div style={{ fontSize: '4rem' }}>📷</div>
          <h3 className="fw-bold mt-2">Start Audit</h3>
          <p className="text-muted small">
            Scan the QR sticker on the ambulance, or enter the number plate below.
          </p>
        </div>

        {!isScanning ? (
          <>
            <div className="card border-0 shadow mb-3">
              <div className="card-body p-4">
                <h5 className="fw-semibold mb-3">Scan QR code</h5>
                <p className="text-muted small mb-3">
                  Point your camera at the ambulance QR sticker. You may need to allow camera access.
                </p>
                <button
                  type="button"
                  className="btn btn-danger w-100 py-2 fw-semibold"
                  onClick={() => setIsScanning(true)}
                >
                  📷 Open camera to scan
                </button>
              </div>
            </div>
            {scanError && (
              <div className="alert alert-warning py-2 small" role="alert">
                {scanError} Use manual entry below.
              </div>
            )}
          </>
        ) : (
          <div className="card border-0 shadow mb-3 overflow-hidden">
            <div className="card-body p-2">
              <div id={SCANNER_ELEMENT_ID} className="rounded" style={{ width: '100%' }} />
              <button
                type="button"
                className="btn btn-outline-secondary w-100 mt-2"
                onClick={handleCloseScanner}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="card border-0 shadow">
          <div className="card-body p-4">
            <h5 className="fw-semibold mb-3">Manual Entry</h5>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="mb-3">
                <label className="form-label">Number Plate</label>
                <input
                  type="text"
                  className={`form-control text-uppercase fs-5 text-center fw-bold ${errors.numberPlate ? 'is-invalid' : ''}`}
                  placeholder="e.g. AMB-001"
                  autoCapitalize="characters"
                  {...register('numberPlate')}
                />
                {errors.numberPlate && (
                  <div className="invalid-feedback">{errors.numberPlate.message}</div>
                )}
              </div>
              <button type="submit" className="btn btn-danger w-100 py-2 fw-semibold">
                🚑 Proceed to Ambulance
              </button>
            </form>
          </div>
        </div>

        {recent.length > 0 && (
          <div className="mt-4">
            <p className="text-muted small mb-2">Recently audited:</p>
            <div className="d-flex flex-wrap gap-2">
              {recent.map((p) => (
                <button
                  key={p}
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    setValue('numberPlate', p);
                    navigate(`/audit/${encodeURIComponent(p)}`);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
