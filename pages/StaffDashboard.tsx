import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, MapPin, Upload, X, Building2, MessageCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import MainLayout from '../components/MainLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { listenToAssignedIssues, IssueRecord, updateIssueStatus } from '../services/issueService';
import { useAuth } from '../context/AuthContext';
import { IssueStatus } from '../types';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

interface ResolveModalState {
  issueId: string;
  file: File | null;
}

const StaffDashboard: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const role = profile?.role;
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<ResolveModalState | null>(null);
  const [inProgressIssueId, setInProgressIssueId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const resolveModalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || role !== 'staff') {
      setIssues([]);
      setIssuesLoading(false);
      return;
    }

    setIssuesLoading(true);
    const unsubscribe = listenToAssignedIssues(user.uid, (records) => {
      setIssues(records);
      setIssuesLoading(false);
    });

    return () => unsubscribe();
  }, [user, role, authLoading]);

  const stats = useMemo(() => {
    const assigned = issues.length;
    const inProgress = issues.filter((issue) => issue.status === IssueStatus.IN_PROGRESS).length;
    const resolvedVisible = issues.filter((issue) => issue.status === IssueStatus.RESOLVED).length;
    return [
      { title: 'Assigned', value: assigned, helperText: 'In your queue' },
      { title: 'In Progress', value: inProgress, helperText: 'Actively being handled' },
      { title: 'Resolved (visible)', value: resolvedVisible, helperText: 'Recently closed' },
    ];
  }, [issues]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateStatus = async (issueId: string, nextStatus: IssueStatus, file?: File | null) => {
    if (!user) return;
    try {
      if (nextStatus === IssueStatus.IN_PROGRESS) {
        setInProgressIssueId(issueId);
      } else {
        setResolving(true);
      }
      setError(null);
      const actorName = profile?.name || user.displayName || user.email || 'City Staff';
      await updateIssueStatus(issueId, nextStatus, user.uid, file, actorName);
      showToast(nextStatus === IssueStatus.IN_PROGRESS ? 'Issue marked In Progress.' : 'Issue resolved and citizen notified.');
      setResolveModal(null);
    } catch (err) {
      console.error(err);
      setError('Unable to update the issue. Please try again.');
    } finally {
      setInProgressIssueId(null);
      setResolving(false);
    }
  };

  const activeIssues = useMemo(
    () =>
      issues
        .filter((issue) => issue.status !== IssueStatus.RESOLVED)
        .filter((issue) => (!showVerifiedOnly ? true : issue.phoneVerified)),
    [issues, showVerifiedOnly]
  );

  const renderIssues = () => {
    if (authLoading || issuesLoading) {
      return <Card className="p-6 text-center text-slate-400">Loading assigned issues...</Card>;
    }

    if (!user || role !== 'staff') {
      return <Card className="p-6 text-center text-slate-400">Sign in with a staff account to view assignments.</Card>;
    }

    if (!activeIssues.length) {
      return <Card className="p-6 text-center text-slate-400">No active issues right now. You&apos;re all caught up!</Card>;
    }

    return activeIssues.map((issue) => (
      <Card key={issue.id} className="border border-white/10 bg-white/5">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-slate-500">{issue.id}</p>
            <h3 className="text-xl font-semibold text-white">{issue.title}</h3>
            <p className="text-slate-400 text-sm mt-1">{issue.description}</p>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-3">
              <MapPin size={16} />
              {issue.locationText || issue.location || 'Location pending'}
            </div>
            {issue.department && (
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 mt-2">
                <Building2 size={14} />
                {issue.department}
              </div>
            )}
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <StatusBadge status={issue.status} />
            <div className="flex gap-3 flex-wrap items-center">
              <Link
                to={`/issues/${issue.id}`}
                className="inline-flex items-center text-sm text-blue-300 hover:text-blue-100 gap-1"
              >
                <MessageCircle size={16} />
                View details
              </Link>
              {issue.status === IssueStatus.SUBMITTED && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={inProgressIssueId === issue.id}
                  className="bg-transparent text-amber-300 border border-amber-300/30 hover:bg-amber-300/10"
                  onClick={() => handleUpdateStatus(issue.id, IssueStatus.IN_PROGRESS)}
                >
                  <Clock3 size={16} className="mr-1" />
                  {inProgressIssueId === issue.id ? 'Updating...' : 'Mark In Progress'}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="bg-transparent text-emerald-300 border border-emerald-300/30 hover:bg-emerald-300/10"
                onClick={() => setResolveModal({ issueId: issue.id, file: null })}
              >
                <CheckCircle2 size={16} className="mr-1" />
                Resolve Issue
              </Button>
            </div>
          </div>
        </div>
      </Card>
    ));
  };

  const resolveFileName = resolveModal?.file?.name || 'Upload after-resolution photo';

  useModalAccessibility(Boolean(resolveModal), resolveModalRef, {
    onClose: () => setResolveModal(null),
  });

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400">Active queue</p>
            <h1 className="text-3xl font-semibold text-white">Staff operations center</h1>
            <p className="text-slate-400 mt-1">Triage assigned issues and keep citizens updated.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowVerifiedOnly((prev) => !prev)}
            className={`inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-2xl text-sm font-semibold border transition-colors ${
              showVerifiedOnly
                ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'
            }`}
          >
            {showVerifiedOnly ? 'Showing verified reporters' : 'All reporters'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stats.map((stat) => (
            <StatCard key={stat.title} title={stat.title} value={authLoading ? '—' : stat.value} helperText={stat.helperText} />
          ))}
        </div>

        {error && <Card className="p-4 border border-red-500/30 bg-red-500/10 text-red-200 text-sm">{error}</Card>}

        <div className="grid gap-5">{renderIssues()}</div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 shadow-lg">
          {toastMessage}
        </div>
      )}

      {resolveModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card
            ref={resolveModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolve-modal-title"
            className="w-full max-w-md bg-slate-900/90 border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400">Wrap up issue</p>
                <h3 id="resolve-modal-title" className="text-xl text-white font-semibold">Upload resolution proof</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolveModal(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Close resolve issue modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-white/20 bg-slate-900/40 cursor-pointer">
                <Upload size={18} className="text-slate-400" />
                <span className="text-sm text-slate-300">{resolveFileName}</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={(e) =>
                    setResolveModal((prev) => (prev ? { ...prev, file: e.target.files?.[0] || null } : prev))
                  }
                />
              </label>
              <p className="text-xs text-slate-500">
                Attach a photo showing the resolved issue. Citizens will see this proof immediately.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setResolveModal(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    resolveModal &&
                    handleUpdateStatus(resolveModal.issueId, IssueStatus.RESOLVED, resolveModal.file || undefined)
                  }
                  disabled={resolving || !resolveModal.file}
                >
                  {resolving ? 'Updating...' : 'Resolve Issue'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

export default StaffDashboard;