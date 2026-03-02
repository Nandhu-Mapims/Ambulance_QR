import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
const BG = { success: 'bg-success', error: 'bg-danger', warning: 'bg-warning', info: 'bg-info' };

function ToastContainer({ toasts, dismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 72,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 280,
        maxWidth: 380,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast show align-items-center text-white border-0 shadow ${BG[t.type]}`}
          role="alert"
          style={{ pointerEvents: 'all', animation: 'slideIn 0.2s ease' }}
        >
          <div className="d-flex">
            <div className="toast-body d-flex align-items-center gap-2">
              <span>{ICONS[t.type]}</span>
              <span className="small fw-semibold">{t.message}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              onClick={() => dismiss(t.id)}
              aria-label="Close"
            />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info', duration = 4500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
};
