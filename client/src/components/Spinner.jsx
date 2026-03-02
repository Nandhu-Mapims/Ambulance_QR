/** Full-page loading spinner with optional text. */
export default function Spinner({ text = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem' }}>
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '4px solid #fee2e2',
          borderTopColor: '#dc2626',
          animation: 'spin .8s linear infinite',
        }} />
      </div>
      {text && <p style={{ color: '#6b7280', fontSize: '.9rem', margin: 0, fontWeight: 500 }}>{text}</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Row-based skeleton loader for tables/lists. */
export function SkeletonRows({ rows = 4, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} style={{ padding: '.75rem 1rem' }}>
              <div className="skeleton skeleton-text" style={{ width: c === 0 ? '80%' : c % 2 === 0 ? '60%' : '45%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Card skeleton for grid layouts. */
export function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
        <div className="skeleton skeleton-avatar" />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text wide" />
          <div className="skeleton skeleton-text short" />
        </div>
      </div>
      <div className="skeleton skeleton-rect" style={{ marginBottom: '.5rem' }} />
      <div className="skeleton skeleton-text mid" />
    </div>
  );
}
