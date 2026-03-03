import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getServerRoot } from '../api/axios';

const STATUS_COLOR = {
  available: 'success',
  dispatched: 'warning',
  maintenance: 'info',
  offline: 'secondary',
};

const SERVER_URL = getServerRoot();

export default function Ambulances() {
  const { isAuthorized } = useAuth();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQR, setSelectedQR] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchAmbulances = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? { status: filterStatus } : {};
      const { data } = await api.get('/ambulances', { params });
      setAmbulances(data.ambulances || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ambulances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, [filterStatus]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ambulance?')) return;
    try {
      await api.delete(`/ambulances/${id}`);
      setAmbulances((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleRegenerateQR = async (id) => {
    try {
      const { data } = await api.post(`/ambulances/${id}/qr`);
      setAmbulances((prev) =>
        prev.map((a) => (a._id === id ? { ...a, qrCode: data.qrCode } : a))
      );
      const updated = ambulances.find((a) => a._id === id);
      if (updated) setSelectedQR({ ...updated, qrCode: data.qrCode });
    } catch (err) {
      alert(err.response?.data?.message || 'QR regeneration failed');
    }
  };

  return (
    <div className="container">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h2 className="fw-bold mb-0">Ambulances</h2>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 160 }}
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="dispatched">Dispatched</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
          {isAuthorized(['admin', 'dispatcher']) && (
            <Link to="/ambulances/add" className="btn btn-danger btn-sm">
              + Add Ambulance
            </Link>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-danger" role="status" />
        </div>
      ) : ambulances.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-3 mb-3">🚑</div>
          <p className="text-muted fs-5">No ambulances found.</p>
          {isAuthorized(['admin', 'dispatcher']) && (
            <Link to="/ambulances/add" className="btn btn-danger">
              Register First Ambulance
            </Link>
          )}
        </div>
      ) : (
        <div className="row g-3">
          {ambulances.map((a) => (
            <div key={a._id} className="col-md-6 col-xl-4">
              <div className="card h-100 border-0 shadow-sm">
                {a.imageUrl && (
                  <img
                    src={`${SERVER_URL}${a.imageUrl}`}
                    className="card-img-top"
                    alt={a.registrationNumber}
                    style={{ height: 160, objectFit: 'cover' }}
                  />
                )}
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0 fw-bold">{a.registrationNumber}</h5>
                    <span
                      className={`badge bg-${STATUS_COLOR[a.status] || 'secondary'} text-capitalize`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="small text-muted mb-1">
                    Type: <strong>{a.vehicleType}</strong>
                  </p>
                  {a.location && (
                    <p className="small text-muted mb-1">📍 {a.location}</p>
                  )}
                  {a.assignedParamedic && (
                    <p className="small text-muted mb-1">
                      👤 {a.assignedParamedic.name}
                    </p>
                  )}
                  {a.notes && <p className="small text-muted mb-2 fst-italic">{a.notes}</p>}

                  <div className="d-flex gap-2 flex-wrap mt-3 pt-2 border-top">
                    {a.qrCode && (
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => setSelectedQR(a)}
                      >
                        QR Code
                      </button>
                    )}
                    {isAuthorized(['admin']) && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleRegenerateQR(a._id)}
                          title="Regenerate QR"
                        >
                          ↻ QR
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(a._id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQR && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={() => setSelectedQR(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  QR Code — {selectedQR.registrationNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedQR(null)}
                />
              </div>
              <div className="modal-body text-center pb-4">
                <img
                  src={selectedQR.qrCode}
                  alt="QR Code"
                  className="img-fluid rounded border"
                  style={{ maxWidth: 250 }}
                />
                <p className="text-muted small mt-3 mb-0">
                  Scan to view ambulance details
                </p>
                <p className="text-muted small">
                  {selectedQR.vehicleType} · {selectedQR.status}
                </p>
                <a
                  href={selectedQR.qrCode}
                  download={`qr-${selectedQR.registrationNumber}.png`}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Download PNG
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
