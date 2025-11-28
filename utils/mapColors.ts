import { IssueStatus } from '../types';

export const getMarkerColor = (status: IssueStatus | string): string => {
  if (status === IssueStatus.RESOLVED || status === 'Resolved') return 'green';
  if (status === IssueStatus.IN_PROGRESS || status === 'In Progress') return 'orange';
  return 'red';
};
