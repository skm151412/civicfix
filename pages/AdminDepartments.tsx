import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Building2, Filter, Loader2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Card from '../components/Card';
import { Select } from '../components/Input';
import { IssueRecord, listenToAllIssues } from '../services/issueService';
import { IssueStatus } from '../types';

const AdminDepartments: React.FC = () => {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToAllIssues((records) => {
      setIssues(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const departmentStats = useMemo(() => {
    const map = new Map<string, { total: number; submitted: number; inProgress: number; resolved: number; sample: IssueRecord[] }>();
    issues.forEach((issue) => {
      const key = issue.department || 'General';
      if (!map.has(key)) {
        map.set(key, { total: 0, submitted: 0, inProgress: 0, resolved: 0, sample: [] });
      }
      const current = map.get(key)!;
      current.total += 1;
      if (issue.status === IssueStatus.SUBMITTED) current.submitted += 1;
      if (issue.status === IssueStatus.IN_PROGRESS) current.inProgress += 1;
      if (issue.status === IssueStatus.RESOLVED) current.resolved += 1;
      if (current.sample.length < 3) {
        current.sample.push(issue);
      }
    });

    return Array.from(map.entries()).map(([department, data]) => ({ department, ...data }));
  }, [issues]);

  const filteredStats = selectedDepartment === 'all'
    ? departmentStats
    : departmentStats.filter((item) => item.department === selectedDepartment);

  const departmentOptions = [
    { value: 'all', label: 'All departments' },
    ...departmentStats.map((item) => ({ value: item.department, label: item.department })),
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-400">Operational readiness</p>
          <h1 className="text-3xl font-semibold text-white">Department performance</h1>
          <p className="text-slate-400 max-w-2xl">
            Track how each municipal department is performing across submissions, assignments, and resolutions. Use this view to rebalance workloads and unblock teams.
          </p>
        </div>

        <Card className="bg-slate-950/40 border-white/5">
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              label="Department filter"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              options={departmentOptions}
            />
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Filter size={16} /> Showing
              <span className="text-white font-semibold">{filteredStats.length}</span> department{filteredStats.length === 1 ? '' : 's'}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <BarChart3 size={16} /> Total issues
              <span className="text-white font-semibold">{issues.length}</span>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading department data…
          </Card>
        ) : !filteredStats.length ? (
          <Card className="p-8 text-center text-slate-400">No issues yet for this selection.</Card>
        ) : (
          <div className="space-y-6">
            {filteredStats.map((item) => (
              <Card key={item.department} className="bg-slate-950/50 border-white/10">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Department</p>
                      <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                        <Building2 size={20} /> {item.department}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">{item.total} total issues</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <p className="text-xs text-slate-400">Submitted</p>
                        <p className="text-xl text-white font-semibold">{item.submitted}</p>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <p className="text-xs text-slate-400">In Progress</p>
                        <p className="text-xl text-blue-300 font-semibold">{item.inProgress}</p>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <p className="text-xs text-slate-400">Resolved</p>
                        <p className="text-xl text-emerald-300 font-semibold">{item.resolved}</p>
                      </div>
                    </div>
                  </div>

                  {item.sample.length ? (
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recent issues</p>
                      {item.sample.map((issue) => (
                        <div key={issue.id} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm text-slate-400">{issue.category}</p>
                              <h3 className="text-lg text-white font-semibold">{issue.title}</h3>
                            </div>
                            <Link
                              to={`/issues/${issue.id}`}
                              className="text-sm text-blue-200 hover:text-white px-3 py-1.5 rounded-2xl border border-blue-400/30"
                            >
                              View
                            </Link>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin size={14} /> {issue.locationText || issue.location || 'No location set'}
                          </div>
                          <div className="text-xs text-slate-500">
                            Status: <span className="text-slate-200">{issue.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No recent issues recorded.</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminDepartments;
