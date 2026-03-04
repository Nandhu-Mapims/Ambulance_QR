import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const ROLE_HOME = {
  EMT: '/scan',
  ADMIN: '/admin/ambulances',
  SUPERVISOR: '/supervisor/actions',
  ASSESSOR_VIEW: '/reports',
};

const FEATURES = [
  { icon: '🔐', text: 'Role-based access control' },
  { icon: '📋', text: 'Dynamic audit checklists' },
  { icon: '📊', text: 'Real-time CQI reporting' },
  { icon: '⚠️', text: 'Corrective action tracking' },
];

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const returnTo = searchParams.get('returnTo');

  // If already logged in and not coming from a protected page with returnTo,
  // send user to their role home instead of showing the login form again.
  // For QR /audit/ flows (which always include returnTo), we always show login.
  if (user && !returnTo) {
    const redirectTo = ROLE_HOME[user.role] || '/audits';
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      const user = await login(data);
      toast(`Welcome back, ${user.name}!`, 'success');
      const from = location.state?.from?.pathname;
      navigate(returnTo ? decodeURIComponent(returnTo) : from || ROLE_HOME[user.role] || '/audits', { replace: true });
    } catch (err) {
      let msg = err.response?.data?.message;
      if (!msg) {
        msg = (err.code === 'ERR_NETWORK' || err.message?.toLowerCase().includes('network'))
          ? 'Cannot reach server. Is the API running on port 5000?'
          : 'Login failed. Check your credentials.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* ── Brand panel ── */}
      <div className="login-brand">
        <div className="login-brand-content anim-fade-up">
          <div style={{ fontSize: '5rem', marginBottom: '1rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.3))' }}>🚑</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '.5rem' }}>
            AmbulanceQR
          </h1>
          <p style={{ opacity: .85, fontSize: '.95rem', marginBottom: '2.5rem' }}>
            Audit Management System
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', width: '100%', maxWidth: 280 }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.text}
                className={`anim-fade-up anim-delay-${i + 1}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  background: 'rgba(255,255,255,.14)', borderRadius: 10,
                  padding: '.6rem 1rem', backdropFilter: 'blur(4px)',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                <span style={{ fontSize: '.85rem', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="login-form-side">
        <div className="anim-slide-right" style={{ width: '100%', maxWidth: 420 }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: '2.5rem',
            boxShadow: '0 20px 60px rgba(29,78,216,.10), 0 4px 16px rgba(0,0,0,.05)',
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontWeight: 900, letterSpacing: '-.04em', marginBottom: '.25rem' }}>Sign In</h2>
              <p style={{ color: '#6b7280', fontSize: '.9rem', margin: 0 }}>
                Enter your credentials to continue
              </p>
            </div>

            {error && (
              <div className="anim-fade-in" style={{
                background: '#eff6ff', border: '1px solid #93c5fd',
                borderRadius: 10, padding: '.75rem 1rem',
                color: '#1e40af', fontSize: '.875rem',
                marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.5rem',
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '.875rem', marginBottom: '.5rem' }}>
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  style={{
                    width: '100%', padding: '.7rem 1rem',
                    border: `1.5px solid ${errors.email ? '#fca5a5' : '#e5e7eb'}`,
                    borderRadius: 10, fontSize: '.9rem',
                    outline: 'none', transition: 'all .2s',
                    background: errors.email ? '#fff5f5' : '#f9fafb',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(29,78,216,.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.email ? '#93c5fd' : '#e2e8f0'; e.target.style.background = errors.email ? '#eff6ff' : '#f9fafb'; e.target.style.boxShadow = 'none'; }}
                />
                {errors.email && <p style={{ color: '#1d4ed8', fontSize: '.8rem', marginTop: '.25rem', marginBottom: 0 }}>{errors.email.message}</p>}
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '.875rem', marginBottom: '.5rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    style={{
                      width: '100%', padding: '.7rem 2.75rem .7rem 1rem',
                      border: `1.5px solid ${errors.password ? '#fca5a5' : '#e5e7eb'}`,
                      borderRadius: 10, fontSize: '.9rem',
                      outline: 'none', transition: 'all .2s',
                      background: errors.password ? '#fff5f5' : '#f9fafb',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(29,78,216,.12)'; }}
                    onBlur={(e) => { e.target.style.borderColor = errors.password ? '#93c5fd' : '#e2e8f0'; e.target.style.background = errors.password ? '#eff6ff' : '#f9fafb'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '.25rem',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p style={{ color: '#1d4ed8', fontSize: '.8rem', marginTop: '.25rem', marginBottom: 0 }}>{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-hero"
                style={{ width: '100%', fontSize: '1rem', padding: '.8rem' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                    <span className="spinner-border spinner-border-sm" />
                    Signing in…
                  </span>
                ) : 'Sign In →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '.8rem', marginTop: '1.5rem', marginBottom: 0 }}>
              Contact your administrator to get an account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
