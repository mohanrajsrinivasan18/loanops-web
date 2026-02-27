'use client';
import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: (id: string) => void;
  duration?: number;
}

export default function Toast({ id, message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="text-success-600" size={20} />,
    error: <XCircle className="text-danger-600" size={20} />,
    warning: <AlertTriangle className="text-warning-600" size={20} />,
    info: <Info className="text-primary-600" size={20} />,
  };

  const bgColors = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-danger-50 border-danger-200',
    warning: 'bg-warning-50 border-warning-200',
    info: 'bg-primary-50 border-primary-200',
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${bgColors[type]} shadow-lg animate-slide-in`}>
      {icons[type]}
      <p className="flex-1 text-sm font-medium text-neutral-900">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: any[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
