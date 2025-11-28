import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label = 'Loading…', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-sm text-slate-400 ${className}`} role="status" aria-live="polite">
      <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
};

export default LoadingSpinner;
