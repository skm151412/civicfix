import React from 'react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ title = 'Something went wrong', message, className = '' }) => {
  return (
    <div
      className={`rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 ${className}`}
      role="alert"
    >
      <p className="font-semibold text-red-200">{title}</p>
      <p className="text-red-100/90">{message}</p>
    </div>
  );
};

export default ErrorAlert;
