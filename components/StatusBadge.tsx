import React from 'react';
import { IssueStatus } from '../types';

interface StatusBadgeProps {
  status: IssueStatus;
}

const badgeStyles: Record<IssueStatus, string> = {
  [IssueStatus.SUBMITTED]: 'bg-blue-500/15 text-blue-200 border-blue-400/30',
  [IssueStatus.IN_PROGRESS]: 'bg-amber-400/10 text-amber-200 border-amber-300/30',
  [IssueStatus.RESOLVED]: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/30',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyles[status]}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
