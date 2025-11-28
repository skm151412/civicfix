import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  helperText?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, helperText }) => {
  return (
    <div className="w-full h-full rounded-3xl bg-white/5 border border-white/10 p-5 shadow-[0_25px_70px_rgba(2,6,23,0.6)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{title}</p>
          <p className="text-3xl font-semibold text-white mt-3">{value}</p>
          {helperText && <p className="text-xs text-slate-400 mt-2">{helperText}</p>}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-200">
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
