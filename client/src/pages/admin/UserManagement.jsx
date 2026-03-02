import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';

/* ── Constants ─────────────────────────────────────────────────────────────── */
const ROLES = ['EMT', 'SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW'];

const ROLE_META = {
  ADMIN:         { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: 'Admin' },
  SUPERVISOR:    { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: 'Supervisor' },
  EMT:           { color: '#059669', bg: '#f0fdf4', border: '#6ee7b7', label: 'EMT' },
  ASSESSOR_VIEW: { color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', label: 'Assessor' },
};

/* ── Zod schema ─────────────────────────────────────────────────────────────── */
const schema = z.object({
  name:     z.string().min(2, 'Name required'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  role:     z.enum(ROLES, { required_error: 'Select a role' }),
  station:  z.string().optional(),
});

/* ── Avatar ─────────────────────────────────────────────────────────────────── */
function Avatar({ name, role }) {
  const m = ROLE_META[role] || ROLE_META.EMT;
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: `linear-gradient(135deg, ${m.color}, #3b82f6)`,
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

/* ── Register Form Drawer ───────────────────────────────────────────────────── */
function RegisterDrawer({ onClose, onSuccess }) {
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/register', data);
      toast(`${data.name} registered successfully`, 'success');
      reset();
      onSuccess();
    } catch (e) {
      toast(e.response?.data?.message || 'Registration failed', 'error');
    }
  };

  const field = (label, key, type = 'text', placeholder = '', required = true) => (
    <div style={{ marginBottom: '.75rem' }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '.75rem', color: '#374151', marginBottom: '.25rem' }}>
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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)',
          zIndex: 1050, backdropFilter: 'blur(2px)',
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 380, background: '#fff', zIndex: 1051,
        boxShadow: '-8px 0 40px rgba(0,0,0,.14)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight .25s cubic-bezier(.4,0,.2,1) both',
      }}>
        {/* Header */}
        <div style={{
          padding: '.75rem 1.1rem',
          background: 'linear-gradient(120deg,#1e3a8a,#1d4ed8)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Administration
            </div>
            <h5 style={{ color: '#fff', fontWeight: 700, margin: 0, fontSize: '.92rem' }}>
              Register New User
            </h5>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 6,
              color: '#fff', width: 26, height: 26, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem' }}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {field('Full Name', 'name', 'text', 'e.g. John Doe')}
            {field('Email Address', 'email', 'email', 'user@ambuqr.com')}
            {field('Password', 'password', 'password', 'Minimum 6 characters')}

            <div style={{ marginBottom: '.75rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '.75rem', color: '#374151', marginBottom: '.25rem' }}>
                Role <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' }}>
                {ROLES.map((r) => {
                  const m = ROLE_META[r];
                  return (
                    <label key={r} style={{ cursor: 'pointer' }}>
                      <input type="radio" value={r} {...register('role')} style={{ display: 'none' }} />
                      <div style={{
                        padding: '.4rem .6rem', borderRadius: 7,
                        border: `1px solid ${m.border}`,
                        background: m.bg, textAlign: 'center',
                        transition: 'all .12s',
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 2px 6px ${m.color}25`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '.75rem', color: m.color }}>{m.label}</div>
                        <div style={{ fontSize: '.63rem', color: '#9ca3af', marginTop: '.05rem' }}>
                          {r === 'ADMIN' && 'Full access'}
                          {r === 'SUPERVISOR' && 'Manage audits'}
                          {r === 'EMT' && 'Field audits'}
                          {r === 'ASSESSOR_VIEW' && 'View reports'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.role && <div style={{ color: '#dc2626', fontSize: '.72rem', marginTop: '.25rem' }}>{errors.role.message}</div>}
            </div>

            {field('Station', 'station', 'text', 'e.g. HQ, North, South', false)}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-hero"
              style={{
                width: '100%', padding: '.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? .7 : 1,
              }}
            >
              {isSubmitting && <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />}
              {isSubmitting ? 'Creating…' : '✓ Create User'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function UserManagement() {
  const toast = useToast();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');

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

  /* Stats */
  const activeCount = users.filter((u) => u.isActive).length;
  const roleCounts  = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter((u) => u.role === r).length }), {});
  const filtered    = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  return (
    <div>
      {/* ── Page heading row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.9rem' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '.1rem' }}>User Management</h2>
          <p style={{ color: '#64748b', fontSize: '.75rem', margin: 0 }}>
            {users.length} total users &nbsp;·&nbsp; {activeCount} active
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-hero"
          style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}
        >
          ＋ Register User
        </button>
      </div>

      {/* ── Stat filter chips ── */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.85rem', flexWrap: 'wrap' }}>
        {ROLES.map((role) => {
          const m = ROLE_META[role];
          const active = roleFilter === role;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(active ? '' : role)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                padding: '.28rem .75rem', borderRadius: 99, border: 'none',
                background: active ? m.color : '#fff',
                color: active ? '#fff' : m.color,
                fontSize: '.72rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all .15s',
                boxShadow: active ? `0 2px 8px ${m.color}40` : '0 1px 3px rgba(0,0,0,.06)',
                outline: active ? 'none' : `1px solid ${m.border}`,
              }}
            >
              <span style={{ fontSize: '.82rem' }}>
                {role === 'ADMIN' && '👑'}
                {role === 'SUPERVISOR' && '🔍'}
                {role === 'EMT' && '🚑'}
                {role === 'ASSESSOR_VIEW' && '📊'}
              </span>
              {m.label}
              <span style={{
                background: active ? 'rgba(255,255,255,.25)' : m.bg,
                color: active ? '#fff' : m.color,
                borderRadius: 99, padding: '0 .35rem',
                fontSize: '.68rem',
              }}>
                {roleCounts[role]}
              </span>
            </button>
          );
        })}
        {roleFilter && (
          <button
            onClick={() => setRoleFilter('')}
            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 99, color: '#94a3b8', fontSize: '.72rem', padding: '.28rem .65rem', cursor: 'pointer' }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Table card ── */}
      <div style={{
        background: '#fff', borderRadius: 8,
        border: '1px solid #e8edf3',
        boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div style={{
          padding: '.5rem .9rem',
          display: 'flex', alignItems: 'center', gap: '.5rem',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <span style={{ fontWeight: 700, fontSize: '.78rem', color: '#374151' }}>
            {roleFilter ? `${ROLE_META[roleFilter]?.label} Users` : 'All Users'}
          </span>
          <span style={{
            background: '#eff6ff', color: '#4f46e5', borderRadius: 99,
            padding: '.05rem .45rem', fontSize: '.68rem', fontWeight: 700,
            border: '1px solid #c7d2fe',
          }}>
            {filtered.length}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem' }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <p>No users found{roleFilter ? ` for ${ROLE_META[roleFilter]?.label}` : ''}.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'User', 'Email', 'Role', 'Station', 'Status', 'Joined', 'Action'].map((h) => (
                  <th key={h} style={{
                    padding: '.45rem .8rem', textAlign: 'left',
                    fontSize: '.65rem', fontWeight: 700, letterSpacing: '.07em',
                    textTransform: 'uppercase', color: '#94a3b8',
                    borderBottom: '1px solid #e8edf3',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u._id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                    opacity: u.isActive ? 1 : .5,
                    transition: 'background .12s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8faff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '.5rem .8rem', color: '#94a3b8', fontSize: '.72rem', width: 36 }}>{i + 1}</td>
                  {/* User */}
                  <td style={{ padding: '.5rem .8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <Avatar name={u.name} role={u.role} />
                      <span style={{ fontWeight: 600, fontSize: '.8rem', color: '#0f172a' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '.5rem .8rem', fontSize: '.75rem', color: '#64748b' }}>{u.email}</td>
                  <td style={{ padding: '.5rem .8rem' }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: '.5rem .8rem', fontSize: '.75rem', color: '#64748b' }}>
                    {u.station ? (
                      <span style={{
                        background: '#f1f5f9', color: '#374151',
                        padding: '.1rem .5rem', borderRadius: 5,
                        fontSize: '.72rem', fontWeight: 600,
                      }}>
                        📍 {u.station}
                      </span>
                    ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '.5rem .8rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                      padding: '.15rem .5rem', borderRadius: 99, fontSize: '.68rem', fontWeight: 700,
                      background: u.isActive ? '#f0fdf4' : '#f8f8f8',
                      color: u.isActive ? '#059669' : '#94a3b8',
                      border: `1px solid ${u.isActive ? '#6ee7b7' : '#e5e7eb'}`,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: u.isActive ? '#059669' : '#94a3b8',
                      }} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '.5rem .8rem', fontSize: '.72rem', color: '#94a3b8' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ padding: '.5rem .8rem' }}>
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={toggling === u._id}
                      style={{
                        padding: '.22rem .65rem', borderRadius: 6, fontSize: '.7rem', fontWeight: 600,
                        border: `1px solid ${u.isActive ? '#fcd34d' : '#6ee7b7'}`,
                        background: u.isActive ? '#fffbeb' : '#f0fdf4',
                        color: u.isActive ? '#d97706' : '#059669',
                        cursor: toggling === u._id ? 'not-allowed' : 'pointer',
                        transition: 'all .12s', opacity: toggling === u._id ? .6 : 1,
                        display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                      }}
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
        )}
      </div>

      {/* ── Register Drawer ── */}
      {showForm && (
        <RegisterDrawer
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchUsers(); }}
        />
      )}
    </div>
  );
}
