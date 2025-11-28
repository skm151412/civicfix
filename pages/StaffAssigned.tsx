import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock3, MapPin, Upload, X } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { IssueRecord, listenToAssignedIssues, updateIssueStatus } from '../services/issueService';
import { IssueStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

interface ResolveModalState {
  issueId: string;
  file: File | null;
}

const statusColumns = [
  {
    key: IssueStatus.SUBMITTED,
    title: 'Awaiting assignment',
    helper: 'Reports that still need a first response',
    accent: 'border-amber-400/30 bg-amber-400/5',
  },
  {
    key: IssueStatus.IN_PROGRESS,
    title: 'In progress',
    helper: 'Issues you are actively working on',
    accent: 'border-blue-400/30 bg-blue-400/5',
  },
  {
    key: IssueStatus.RESOLVED,
    title: 'Recently resolved',
    helper: 'Closed tickets with proof shared',
    accent: 'border-emerald-400/30 bg-emerald-400/5',
  },
];

const StaffAssigned: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingIssueId, setActingIssueId] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<ResolveModalState | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useModalAccessibility(Boolean(resolveModal), modalRef, {
    onClose: () => setResolveModal(null),
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || profile?.role !== 'staff') {
      setIssues([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenToAssignedIssues(user.uid, (records) => {
      setIssues(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile?.role, authLoading]);

  const groupedIssues = useMemo(() => {
    return statusColumns.map((column) => ({
      ...column,
      items: issues
        .filter((issue) => issue.status === column.key)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    }));
  }, [issues]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateStatus = async (issueId: string, nextStatus: IssueStatus, file?: File | null) => {
    if (!user) return;
    try {
      setActingIssueId(issueId);
      setError(null);
      const actorName = profile?.name || user.displayName || user.email || 'City Staff';
      await updateIssueStatus(issueId, nextStatus, user.uid, file, actorName);
      showToast(nextStatus === IssueStatus.IN_PROGRESS ? 'Issue moved to In Progress.' : 'Issue resolved with proof.');
      setResolveModal(null);
    } catch (err) {
      console.error(err);
      setError('Failed to update the issue. Please retry.');
    } finally {
      setActingIssueId(null);
    }
  };

  const renderIssueCard = (issue: IssueRecord) => (
    <Card key={issue.id} className="bg-slate-950/40 border-white/5">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-slate-500">{issue.id}</p>
            <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{issue.description}</p>
          </div>
          <StatusBadge status={issue.status} />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MapPin size={14} />
          {issue.locationText || issue.location || 'Location pending'}
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{issue.department || 'General'}</div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link to={`/issues/${issue.id}`} className="text-sm text-blue-300 hover:text-blue-100">
              View details
            </Link>
            {issue.status === IssueStatus.SUBMITTED && (
              <Button
                variant="secondary"
                size="sm"
                disabled={actingIssueId === issue.id}
                onClick={() => handleUpdateStatus(issue.id, IssueStatus.IN_PROGRESS)}
                className="border-amber-400/40 text-amber-100 bg-transparent"
              >
                <Clock3 size={16} className="mr-1" />
                {actingIssueId === issue.id ? 'Updating…' : 'Take ownership'}
              </Button>
            )}
            {issue.status === IssueStatus.IN_PROGRESS && (
              <Button
                size="sm"
                onClick={() => setResolveModal({ issueId: issue.id, file: null })}
                className="bg-emerald-500/20 border border-emerald-400/30"
              >
                <CheckCircle2 size={16} className="mr-1" /> Upload proof
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-400">Queue visibility</p>
          <h1 className="text-3xl font-semibold text-white">Assigned issues board</h1>
          <p className="text-slate-400 max-w-2xl">All tickets that require your attention live here. Claim work, see context, and close out reports with proof.</p>
        </div>

        {error && (
          <Card className="p-4 border border-red-500/30 bg-red-500/5 text-red-200 flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </Card>
        )}

        {loading ? (
          <Card className="p-8 text-center text-slate-400">Loading assignments…</Card>
        ) : !issues.length ? (
          <Card className="p-8 text-center text-slate-400">No tickets waiting right now.</Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {groupedIssues.map((column) => (
              <div key={column.key} className="space-y-4">
                <div className={`rounded-3xl border ${column.accent} p-4 bg-slate-900/40`}>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{column.title}</p>
                  <h3 className="text-2xl font-semibold text-white mt-2">{column.items.length}</h3>
                  <p className="text-sm text-slate-400 mt-1">{column.helper}</p>
                </div>
                <div className="space-y-4 min-h-[120px]">
                  {column.items.length ? column.items.map(renderIssueCard) : (
                    <Card className="p-4 text-sm text-slate-500">Nothing here yet.</Card>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 px-5 py-3 rounded-2xl bg-slate-900 border border-white/10 text-slate-100 shadow-lg">
          {toastMessage}
        </div>
      )}

      {resolveModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-resolve-title"
            className="w-full max-w-md bg-slate-900/95 border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400">Finish the ticket</p>
                <h3 id="staff-resolve-title" className="text-xl text-white font-semibold">Upload after photo</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolveModal(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Close resolve modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-white/20 bg-slate-900/40 cursor-pointer">
                <Upload size={18} className="text-slate-400" />
                <span className="text-sm text-slate-300">{resolveModal.file?.name || 'Attach resolution proof'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) =>
                    setResolveModal((prev) => (prev ? { ...prev, file: e.target.files?.[0] || null } : prev))
                  }
                />
              </label>
              <p className="text-xs text-slate-500">Citizens cannot see a resolved badge until you share proof.</p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setResolveModal(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={!resolveModal.file || actingIssueId === resolveModal.issueId}
                  onClick={() =>
                    resolveModal &&
                    handleUpdateStatus(resolveModal.issueId, IssueStatus.RESOLVED, resolveModal.file || undefined)
                  }
                >
                  {actingIssueId === resolveModal.issueId ? 'Saving…' : 'Resolve issue'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

export default StaffAssigned;
