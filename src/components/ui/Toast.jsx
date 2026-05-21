import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: {
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)',
    border: 'rgba(16,185,129,0.35)',
    icon: '#10B981',
    title: '#10B981',
    bar: '#10B981',
  },
  error: {
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.08) 100%)',
    border: 'rgba(239,68,68,0.35)',
    icon: '#EF4444',
    title: '#EF4444',
    bar: '#EF4444',
  },
  warning: {
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.08) 100%)',
    border: 'rgba(245,158,11,0.35)',
    icon: '#F59E0B',
    title: '#F59E0B',
    bar: '#F59E0B',
  },
  info: {
    bg: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(79,70,229,0.08) 100%)',
    border: 'rgba(99,102,241,0.35)',
    icon: '#6366F1',
    title: '#6366F1',
    bar: '#6366F1',
  },
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const duration = toast.duration || 3500;
  const color = COLORS[toast.type] || COLORS.info;
  const Icon = ICONS[toast.type] || Info;

  useEffect(() => {
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10);
    // Start leave animation before removal
    const t2 = setTimeout(() => setLeaving(true), duration - 350);
    // Actually remove
    const t3 = setTimeout(() => onRemove(toast.id), duration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 350);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '14px',
        background: color.bg,
        border: `1px solid ${color.border}`,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
        minWidth: '300px',
        maxWidth: '400px',
        position: 'relative',
        overflow: 'hidden',
        transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(30px) scale(0.95)',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease',
        cursor: 'default',
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          background: color.bar,
          borderRadius: '0 0 0 14px',
          animation: `toastProgress ${duration}ms linear forwards`,
          opacity: 0.7,
        }}
      />

      {/* Icon */}
      <div style={{
        flexShrink: 0,
        width: 36,
        height: 36,
        borderRadius: '10px',
        background: `${color.icon}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={18} style={{ color: color.icon }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{
            fontWeight: 600,
            fontSize: '0.875rem',
            color: color.title,
            marginBottom: toast.message ? '3px' : 0,
            lineHeight: 1.3,
          }}>
            {toast.title}
          </div>
        )}
        {toast.message && (
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
          }}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '6px',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <>
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'all' }}>
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </div>
    </>
  );
}
