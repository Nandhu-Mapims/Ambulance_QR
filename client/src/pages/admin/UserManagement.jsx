import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';

/* ── Constants: one color per role everywhere (filters, badges, avatars) ───────── */
const ROLES = ['EMT', 'SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW'];

const ROLE_META = {
  ADMIN:         { color: '#dc2626', dark: '#b91c1c', bg: '#fef2f2', border: '#fca5a5', label: 'Admin' },
  SUPERVISOR:    { color: '#d97706', dark: '#b45309', bg: '#fffbeb', border: '#fcd34d', label: 'Supervisor' },
  EMT:           { color: '#059669', dark: '#047857', bg: '#f0fdf4', border: '#6ee7b7', label: 'EMT' },
  ASSESSOR_VIEW: { color: '#2563eb', dark: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', label: 'Assessor' },
};

/* ── Zod schema ─────────────────────────────────────────────────────────────── */
const schema = z.object({
  name:     z.string().min(2, 'Name required'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  role:     z.enum(ROLES, { required_error: 'Select a role' }),
  station:  z.string().optional(),
});

/* ── Avatar (uses role color only so it matches badge and filter) ────────────── */
function Avatar({ name, role }) {
  const m = ROLE_META[role] || ROLE_META.EMT;
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: `linear-gradient(135deg, ${m.color}, ${m.dark})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: '.72rem', color: '#fff', flexShrink: 0,
    }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Role Badge ─────────────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const m = ROLE_META[role] || { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', label: role };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
      padding: '.15rem .5rem', borderRadius: 99,
      background: m.bg, border: `1px solid ${m.border}`,
      color: m.color, fontSize: '.68rem', fontWeight: 700, letterSpacing: '.03em',
    }}>
      {m.label}
    </span>
  );
}

/* ── Create User Form (horizontal panel above list or vertical in drawer) ──────── */
function CreateUserForm({ onSuccess, horizontal = false }) {
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/register', data);
      toast(`${data.name} registered successfully`, 'success');
      reset();
      onSuccess?.();
    } catch (e) {
      toast(e.response?.data?.message || 'Registration failed', 'error');
    }
  };

  const field = (label, key, type = 'text', placeholder = '', required = true) => (
    <div style={{ marginBottom: horizontal ? 0 : '.75rem', minWidth: horizontal ? 120 : undefined, flex: horizontal ? '1 1 120px' : undefined }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '.75rem', color: 'var(--primary-dark)', marginBottom: '.25rem' }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className={`form-control form-control-sm ${errors[key] ? 'is-invalid' : ''}`}
        style={{ fontSize: '13px', padding: '.38rem .65rem' }}
        {...register(key)}
      />
      {errors[key] && <div className="invalid-feedback" style={{ fontSize: '.72rem' }}>{errors[key].message}</div>}
    </div>
  );

  const roleDropdown = (
    <div style={{ marginBottom: horizontal ? 0 : '.75rem', minWidth: horizontal ? 140 : undefined, flex: horizontal ? '0 1 auto' : undefined }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '.75rem', color: 'var(--primary-dark)', marginBottom: '.25rem' }}>
        Role <span style={{ color: '#dc2626' }}>*</span>
      </label>
      <select
        className={`form-select form-select-sm ${errors.role ? 'is-invalid' : ''}`}
        style={{ fontSize: '13px', padding: '.38rem .65rem', minWidth: 140 }}
        {...register('role')}
        aria-label="Select role"
      >
        <option value="">Select role…</option>
        {ROLES.map((r) => {
          const m = ROLE_META[r];
          return (
            <option key={r} value={r}>{m.label}</option>
          );
        })}
      </select>
      {errors.role && <div className="invalid-feedback" style={{ fontSize: '.72rem' }}>{errors.role.message}</div>}
    </div>
  );

  if (horizontal) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '.75rem 1rem' }}>
        {field('Name', 'name', 'text', 'e.g. John Doe')}
        {field('Email', 'email', 'email', 'user@example.com')}
        {field('Password', 'password', 'password', 'Min 6')}
        {roleDropdown}
        {field('Station', 'station', 'text', 'e.g. HQ', false)}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-hero"
          style={{
            padding: '.38rem 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.35rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            flexShrink: 0,
          }}
        >
          {isSubmitting && <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />}
          {isSubmitting ? 'Creating…' : '✓ Create User'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {field('Full Name', 'name', 'text', 'e.g. John Doe')}
      {field('Email Address', 'email', 'email', 'user@ambuqr.com')}
      {field('Password', 'password', 'password', 'Minimum 6 characters')}
      {roleDropdown}
      {field('Station', 'station', 'text', 'e.g. HQ, North, South', false)}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-hero"
        style={{
          width: '100%', padding: '.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting && <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />}
        {isSubmitting ? 'Creating…' : '✓ Create User'}
      </button>
    </form>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function UserManagement() {
  const toast = useToast();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'active' | 'inactive'
  const [stationFilter, setStationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(() =>
    api.get('/auth/users')
      .then(({ data }) => setUsers(data.users))
      .catch(() => toast('Failed to load users', 'error'))
      .finally(() => setLoading(false)),
  [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (user) => {
    setToggling(user._id);
    try {
      await api.patch(`/auth/users/${user._id}/status`, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      toast(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}`, 'info');
    } catch (e) {
      toast(e.response?.data?.message || 'Update failed', 'error');
    } finally {
      setToggling(null);
    }
  };

  /* Stats & filter logic */
  const activeCount = users.filter((u) => u.isActive).length;
  const roleCounts  = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter((u) => u.role === r).length }), {});
  const stations    = [...new Set(users.map((u) => u.station).filter(Boolean))].sort();

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.isActive) return false;
    if (statusFilter === 'inactive' && u.isActive) return false;
    if (stationFilter && (u.station ?? '') !== stationFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = (u.name ?? '').toLowerCase().includes(q);
      const matchEmail = (u.email ?? '').toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  const isEmptyFiltered = filtered.length === 0 && users.length > 0;
  const hasActiveFilters = roleFilter || statusFilter || stationFilter || searchQuery.trim();
  const clearAllFilters = () => {
    setRoleFilter('');
    setStatusFilter('');
    setStationFilter('');
    setSearchQuery('');
  };

  return (
    <div className="page-shell admin-page admin-users">
      <div className="admin-banner">
        <div className="admin-banner-inner">
          <h2 className="admin-banner-title">User Management</h2>
          <p className="admin-banner-subtitle">
            {users.length} total users · {activeCount} active
          </p>
        </div>
      </div>

      <div className="admin-form-card admin-create-user">
        <div className="admin-form-title">Register new user</div>
        <CreateUserForm onSuccess={fetchUsers} horizontal />
      </div>

      <div className="admin-filter-bar admin-role-filters">
        <div className="admin-role-pills">
        {ROLES.map((role) => {
          const m = ROLE_META[role];
          const active = roleFilter === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(active ? '' : role)}
              aria-pressed={active}
              aria-label={active ? 'Show all users' : `Filter by ${m.label}`}
              className="admin-role-pill"
              style={{
                borderColor: active ? m.color : undefined,
                background: active ? m.color : 'var(--card-bg)',
                color: active ? '#fff' : m.color,
              }}
            >
              <span className="admin-role-pill-icon">
                {role === 'ADMIN' && '👑'}
                {role === 'SUPERVISOR' && '🔍'}
                {role === 'EMT' && '🚑'}
                {role === 'ASSESSOR_VIEW' && '📊'}
              </span>
              {m.label}
              <span className="admin-role-pill-count" style={{
                background: active ? 'rgba(255,255,255,.25)' : m.bg,
                color: active ? '#fff' : m.color,
              }}>
                {roleCounts[role]}
              </span>
            </button>
          );
        })}
        {roleFilter && (
          <button type="button" className="admin-filter-clear" onClick={() => setRoleFilter('')}>
            ✕ Clear
          </button>
        )}
        </div>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-header">
          <span className="admin-table-title">
            {roleFilter ? `${ROLE_META[roleFilter]?.label} Users` : 'All Users'}
          </span>
          <span className="admin-table-badge">{filtered.length}</span>
        </div>

        <div className="admin-table-filters">
          <input
            type="search"
            placeholder="Search name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search users by name or email"
            className="admin-search-input"
          />
          <span className="admin-filter-label-inline">Status:</span>
          {['', 'active', 'inactive'].map((s) => {
            const label = s === '' ? 'All' : s === 'active' ? 'Active' : 'Inactive';
            const isActive = statusFilter === s;
            return (
              <button
                key={s || 'all'}
                type="button"
                onClick={() => setStatusFilter(s)}
                aria-pressed={isActive}
                className={`admin-status-pill ${isActive ? 'active' : ''}`}
              >
                {label}
              </button>
            );
          })}
          {stations.length > 0 && (
            <>
              <span className="admin-filter-label-inline">Station:</span>
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                aria-label="Filter by station"
                className="admin-station-select"
              >
                <option value="">All stations</option>
                {stations.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </>
          )}
          {hasActiveFilters && (
            <button type="button" className="admin-filter-clear" onClick={clearAllFilters}>
              ✕ Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="admin-loading"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            {isEmptyFiltered ? (
              <>
                <p>{hasActiveFilters ? 'No users match the current filters.' : `No users in ${ROLE_META[roleFilter]?.label ?? roleFilter}.`}</p>
                <button type="button" className="btn-hero" style={{ marginTop: '.75rem' }} onClick={clearAllFilters}>
                  {hasActiveFilters ? 'Clear filters' : 'Show all'}
                </button>
              </>
            ) : (
              <p>No users found. Register one to get started.</p>
            )}
          </div>
        ) : (
          <>
            <div className="admin-table-wrap d-none d-md-block">
              <div style={{ overflowX: 'auto' }}>
                <table className="table qr-table mb-0" style={{ minWidth: 640 }}>
                  <thead>
                    <tr>
                      {['#', 'User', 'Email', 'Role', 'Station', 'Status', 'Joined', 'Action'].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                        <td style={{ color: 'var(--sidebar-text-dim)', fontSize: '.75rem', width: 36 }}>{i + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                            <Avatar name={u.name} role={u.role} />
                            <span style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--primary-dark)' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '.8125rem', color: 'var(--sidebar-text-dim)' }}>{u.email}</td>
                        <td><RoleBadge role={u.role} /></td>
                        <td style={{ fontSize: '.8125rem', color: 'var(--sidebar-text-dim)' }}>
                          {u.station ? (
                            <span style={{
                              background: 'var(--slate-100)', color: 'var(--sidebar-text-dim)',
                              padding: '.15rem .5rem', borderRadius: 'var(--radius-sm)',
                              fontSize: '.75rem', fontWeight: 600,
                            }}>
                              📍 {u.station}
                            </span>
                          ) : <span style={{ color: 'var(--slate-200)' }}>—</span>}
                        </td>
                        <td>
                          <span role="status" aria-label={u.isActive ? 'Active' : 'Inactive'} className={`admin-user-status ${u.isActive ? 'active' : ''}`}>
                            <span />
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ fontSize: '.75rem', color: 'var(--sidebar-text-dim)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggle(u)}
                            disabled={toggling === u._id}
                            aria-label={u.isActive ? `Deactivate ${u.name}` : `Activate ${u.name}`}
                            className="admin-toggle-btn"
                          >
                            {toggling === u._id
                              ? <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} />
                              : u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <ul className="admin-card-list admin-user-cards d-md-none">
              {filtered.map((u) => (
                <li key={u._id} className={`admin-card admin-user-card ${!u.isActive ? 'admin-card--inactive' : ''}`}>
                  <div className="admin-user-card-top">
                    <Avatar name={u.name} role={u.role} />
                    <div className="admin-user-card-info">
                      <span className="admin-user-card-name">{u.name}</span>
                      <span className="admin-user-card-email">{u.email}</span>
                    </div>
                    <RoleBadge role={u.role} />
                  </div>
                  <div className="admin-user-card-meta">
                    {u.station && <span className="admin-user-card-station">📍 {u.station}</span>}
                    <span className="admin-user-card-joined">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}
                    </span>
                    <span role="status" aria-label={u.isActive ? 'Active' : 'Inactive'} className={`admin-user-status ${u.isActive ? 'active' : ''}`}>
                      <span />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(u)}
                    disabled={toggling === u._id}
                    aria-label={u.isActive ? `Deactivate ${u.name}` : `Activate ${u.name}`}
                    className="admin-card-btn admin-user-card-toggle"
                  >
                    {toggling === u._id
                      ? <span className="spinner-border spinner-border-sm" />
                      : u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
