/**
 * Manual entry fallback when the EMT can't scan.
 * Navigates to /audit/:numberPlate which then resolves the token — for
 * the manual flow we pass a special flag so AuditLanding skips token validation
 * and lets the EMT proceed with the latest active template.
 *
 * A smarter real-world solution would be to look up the latest token via a
 * protected API, but for simplicity we navigate to the landing page and if
 * no token is present the API returns the public info without token check.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  numberPlate: z.string().min(2, 'Enter a valid number plate'),
});

export default function AuditScan() {
  const navigate = useNavigate();
  const [recent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentPlates') || '[]'); }
    catch { return []; }
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = ({ numberPlate }) => {
    // Save to recent history
    const updated = [numberPlate, ...recent.filter((p) => p !== numberPlate)].slice(0, 5);
    localStorage.setItem('recentPlates', JSON.stringify(updated));

    // Navigate to landing — AuditLanding will show an "enter token" prompt if needed
    navigate(`/audit/${encodeURIComponent(numberPlate.trim().toUpperCase())}`);
  };

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-md-6 col-lg-4">
        <div className="text-center mb-5">
          <div style={{ fontSize: '4rem' }}>📷</div>
          <h3 className="fw-bold mt-2">Start Audit</h3>
          <p className="text-muted small">
            Scan the QR sticker on the ambulance. If you can't scan,<br />
            enter the number plate manually below.
          </p>
        </div>

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
