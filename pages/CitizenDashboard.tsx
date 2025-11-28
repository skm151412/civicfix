import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Clock3 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import MainLayout from '../components/MainLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import { IssueStatus } from '../types';

const CitizenDashboard: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { issues, loading: issuesLoading } = useIssues();
  const navigate = useNavigate();

  const { total, inProgress, resolved } = useMemo(() => {
    return {
      total: issues.length,
      inProgress: issues.filter((issue) => issue.status === IssueStatus.IN_PROGRESS).length,
      resolved: issues.filter((issue) => issue.status === IssueStatus.RESOLVED).length,
    };
  }, [issues]);

  const recentIssues = useMemo(() => issues.slice(0, 3), [issues]);
  const stats = [
    { label: 'Total Issues', value: authLoading || issuesLoading ? '—' : total, icon: AlertTriangle },
    { label: 'In Progress', value: authLoading || issuesLoading ? '—' : inProgress, icon: Clock3 },
    { label: 'Resolved', value: authLoading || issuesLoading ? '—' : resolved, icon: CheckCircle2 },
    { label: 'Avg. Response', value: '12h', icon: Clock3 },
  ];

  const greetingName = user?.displayName || user?.email?.split('@')[0] || 'Neighbor';
  const readyForData = !!user && !authLoading;

  return (
    <MainLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm text-slate-400">Good afternoon</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-semibold text-white">Welcome back, {greetingName} 👋</h1>
              {profile?.phoneVerified && <VerifiedBadge />}
            </div>
            <p className="text-slate-400 mt-2">Here&apos;s a quick overview of what&apos;s happening in your neighborhood.</p>
          </div>
          <Button className="self-start md:self-auto" onClick={() => navigate('/citizen/report')}>
            Report New Issue
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <StatCard key={stat.label} title={stat.label} value={stat.value} icon={stat.icon} />
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Issues</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300">View all</button>
          </div>

          <div className="space-y-3">
            {authLoading || issuesLoading ? (
              <Card className="p-4 border-white/10 bg-white/5 text-slate-400">Loading your latest issues...</Card>
            ) : !readyForData ? (
              <Card className="p-4 border-white/10 bg-white/5 text-slate-400">Sign in to view your recent issues.</Card>
            ) : recentIssues.length === 0 ? (
              <Card className="p-4 border-white/10 bg-white/5 text-slate-400">No issues reported yet. Submit one to see it here instantly.</Card>
            ) : (
              recentIssues.map((issue) => (
                <Card key={issue.id} className="p-4 border-white/10 bg-white/5">
                  <div className="flex flex-wrap items-center gap-4 justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{issue.title}</p>
                      <p className="text-sm text-slate-400">{issue.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">{issue.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <StatusBadge status={issue.status} />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CitizenDashboard;