import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerSchema } from '../schemas/authSchemas';

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setServerError('');
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...userData } = formData;
      await authRegister(userData);
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center mt-4 mb-4">
      <div className="col-md-6 col-lg-5">
        <div className="card border-0 shadow">
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <div className="display-4">🚑</div>
              <h2 className="fw-bold text-danger">Create Account</h2>
              <p className="text-muted small">Join Ambulance QR Management</p>
            </div>

            {serverError && (
              <div className="alert alert-danger alert-dismissible" role="alert">
                {serverError}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setServerError('')}
                />
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="mb-3">
                <label htmlFor="name" className="form-label fw-semibold">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  placeholder="John Doe"
                  {...register('name')}
                />
                {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-semibold">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email.message}</div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="role" className="form-label fw-semibold">
                  Role
                </label>
                <select
                  id="role"
                  className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                  {...register('role')}
                >
                  <option value="dispatcher">Dispatcher</option>
                  <option value="paramedic">Paramedic</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && <div className="invalid-feedback">{errors.role.message}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label fw-semibold">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Min. 6 characters"
                  {...register('password')}
                />
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label fw-semibold">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-danger w-100 py-2 fw-semibold"
                disabled={loading}
              >
                {loading && (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                )}
                Create Account
              </button>
            </form>

            <p className="text-center mt-4 text-muted mb-0">
              Already have an account?{' '}
              <Link to="/login" className="text-danger fw-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
