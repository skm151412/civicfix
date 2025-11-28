import React from 'react';

interface ToastProps {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

const variantStyles: Record<NonNullable<ToastProps['variant']>, string> = {
  info: 'border-sky-400/40 bg-sky-500/10 text-sky-100',
  success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
  warning: 'border-amber-400/40 bg-amber-500/10 text-amber-100',
  error: 'border-rose-400/40 bg-rose-500/10 text-rose-100',
};

const Toast: React.FC<ToastProps> = ({ message, variant = 'info' }) => {
  return (
    <div className={`px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur bg-opacity-70 text-sm ${variantStyles[variant]}`}>
      {message}
    </div>
  );
};

export default Toast;
