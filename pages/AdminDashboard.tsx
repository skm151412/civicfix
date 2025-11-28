import React, { useMemo } from 'react';
import { BarChart3, Clock3, ShieldCheck, Users, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import MainLayout from '../components/MainLayout';
import StatCard from '../components/StatCard';
import { useIssues } from '../context/IssueContext';
import { IssueStatus } from '../types';

const AdminDashboard: React.FC = () => {
  const { issues, loading } = useIssues();

  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter(i => i.status === IssueStatus.OPEN || i.status === IssueStatus.IN_PROGRESS).length;
    const resolved = issues.filter(i => i.status === IssueStatus.RESOLVED).length;
    const rejected = issues.filter(i => i.status === IssueStatus.REJECTED).length;

    return { total, open, resolved, rejected };
  }, [issues]);

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach(issue => {
      counts[issue.category] = (counts[issue.category] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([category, count]) => ({ category, count }));
  }, [issues]);

  const statCards = [
    { label: 'Total Issues', value: loading ? '...' : stats.total.toString(), icon: BarChart3 },
    { label: 'Active Issues', value: loading ? '...' : stats.open.toString(), icon: ShieldCheck },
    { label: 'Resolved', value: loading ? '...' : stats.resolved.toString(), icon: Users },
    { label: 'Rejected', value: loading ? '...' : stats.rejected.toString(), icon: AlertTriangle },
  ];

  return (
    <MainLayout>
      <div className="space-y-10">
        <div>
          <p className="text-sm text-slate-400">City operations</p>
          <h1 className="text-3xl font-semibold text-white">Admin overview</h1>
          <p className="text-slate-400 mt-1">Real-time metrics across all districts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map((stat) => (
            <StatCard key={stat.label} title={stat.label} value={stat.value} icon={stat.icon} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">Top Categories</h2>
                <p className="text-sm text-slate-400">Most reported issue types.</p>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <p className="text-slate-400">Loading data...</p>
              ) : categoryStats.length === 0 ? (
                <p className="text-slate-400">No data available.</p>
              ) : (
                categoryStats.map((item) => (
                  <div key={item.category} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{item.category}</p>
                      <p className="text-sm text-slate-500">{item.count} issues</p>
                    </div>
                    <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${(item.count / stats.total) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>
              <p className="text-sm text-slate-400">Latest submissions and updates.</p>
            </div>
            <div className="space-y-4">
              {loading ? (
                <p className="text-slate-400">Loading...</p>
              ) : issues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    issue.status === IssueStatus.RESOLVED ? 'bg-emerald-500' : 
                    issue.status === IssueStatus.REJECTED ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{issue.title}</p>
                    <p className="text-xs text-slate-500">
                      {issue.createdAt.toLocaleDateString()} • {issue.category}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5">
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;