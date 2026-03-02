import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { ambulanceSchema } from '../schemas/ambulanceSchemas';

export default function AddAmbulance() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ambulanceSchema),
    defaultValues: { status: 'available' },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setServerError('');

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '') formData.append(key, value);
      });
      if (imageFile) formData.append('image', imageFile);

      await api.post('/ambulances', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/ambulances');
    } catch (err) {
      const msg =
        err.response?.data?.errors?.map((e) => e.message).join(', ') ||
        err.response?.data?.message ||
        'Failed to register ambulance';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="d-flex align-items-center mb-4 gap-3">
            <Link to="/ambulances" className="btn btn-sm btn-outline-secondary">
              ← Back
            </Link>
            <h3 className="fw-bold mb-0">Register New Ambulance</h3>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {serverError && (
                <div className="alert alert-danger alert-dismissible">
                  {serverError}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setServerError('')}
                  />
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="regNum" className="form-label fw-semibold">
                      Registration Number <span className="text-danger">*</span>
                    </label>
                    <input
                      id="regNum"
                      type="text"
                      className={`form-control ${errors.registrationNumber ? 'is-invalid' : ''}`}
                      placeholder="e.g. AMB-001"
                      {...register('registrationNumber')}
                    />
                    {errors.registrationNumber && (
                      <div className="invalid-feedback">
                        {errors.registrationNumber.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="vehicleType" className="form-label fw-semibold">
                      Vehicle Type <span className="text-danger">*</span>
                    </label>
                    <select
                      id="vehicleType"
                      className={`form-select ${errors.vehicleType ? 'is-invalid' : ''}`}
                      {...register('vehicleType')}
                    >
                      <option value="">Select type…</option>
                      <option value="BLS">BLS — Basic Life Support</option>
                      <option value="ALS">ALS — Advanced Life Support</option>
                      <option value="CCT">CCT — Critical Care Transport</option>
                      <option value="MCI">MCI — Mass Casualty Incident</option>
                    </select>
                    {errors.vehicleType && (
                      <div className="invalid-feedback">{errors.vehicleType.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="status" className="form-label fw-semibold">
                      Status
                    </label>
                    <select id="status" className="form-select" {...register('status')}>
                      <option value="available">Available</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="location" className="form-label fw-semibold">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Station 1 — Downtown"
                      {...register('location')}
                    />
                  </div>

                  <div className="col-12">
                    <label htmlFor="notes" className="form-label fw-semibold">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      className="form-control"
                      rows={3}
                      placeholder="Additional information…"
                      {...register('notes')}
                    />
                  </div>

                  <div className="col-12">
                    <label htmlFor="image" className="form-label fw-semibold">
                      Ambulance Photo
                    </label>
                    <input
                      id="image"
                      type="file"
                      className="form-control"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                    />
                    <div className="form-text">Max 5 MB · JPG, PNG, WEBP</div>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mt-2 rounded border"
                        style={{ maxHeight: 140, maxWidth: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button type="submit" className="btn btn-danger px-4" disabled={loading}>
                    {loading && (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                    )}
                    Register Ambulance
                  </button>
                  <Link to="/ambulances" className="btn btn-outline-secondary">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
