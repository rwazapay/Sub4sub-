import React from 'react';
import { Sparkles, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const bgStyles = {
    success: 'bg-indigo-600 text-white border-indigo-400/40',
    error: 'bg-red-600 text-white border-red-400/40',
    info: 'bg-slate-800 text-white border-slate-700',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />,
    error: <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-300 shrink-0" />,
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-bounce">
      <div className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold ${bgStyles[toast.type]}`}>
        <div className="flex items-center gap-2.5">
          {icons[toast.type]}
          <span>{toast.text}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/20 text-white/80 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
