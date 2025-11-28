import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ThumbsUp } from 'lucide-react';
import Card from '../components/Card';
import MainLayout from '../components/MainLayout';
import StatusBadge from '../components/StatusBadge';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { IssueStatus } from '../types';
import { toggleUpvoteIssue } from '../services/issueService';

const TrackIssues: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | IssueStatus>('All');
  const { issues, loading: issuesLoading } = useIssues();
  const { user, loading: authLoading } = useAuth();
  const [upvoteLoadingId, setUpvoteLoadingId] = useState<string | null>(null);

  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        const searchableFields = `${issue.title} ${issue.category} ${issue.id}`.toLowerCase();
        const matchesSearch = searchableFields.includes(search.toLowerCase());
        const matchesFilter = filter === 'All' || issue.status === filter;
        return matchesSearch && matchesFilter;
      })
      .map((issue) => ({
        ...issue,
        formattedDate: issue.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      }));
  }, [issues, search, filter]);

  const renderContent = () => {
    if (authLoading || issuesLoading) {
      return <div className="px-6 py-8 text-center text-slate-400">Loading your issues...</div>;
    }

    if (!user) {
      return <div className="px-6 py-8 text-center text-slate-400">Sign in to view and track your reported issues.</div>;
    }

    if (!issues.length) {
      return <div className="px-6 py-8 text-center text-slate-400">No issues submitted yet. Report your first issue to get started.</div>;
    }

    if (!filteredIssues.length) {
      return <div className="px-6 py-8 text-center text-slate-400">No issues match your filters.</div>;
    }

    const handleToggle = async (issueId: string) => {
      if (!user) return;
      try {
        setUpvoteLoadingId(issueId);
        await toggleUpvoteIssue(issueId, user.uid);
      } catch (err) {
        console.error('Unable to toggle upvote', err);
      } finally {
        setUpvoteLoadingId(null);
      }
    };

    return filteredIssues.map((issue) => {
      const hasUpvoted = user ? issue.upvotedBy?.includes(user.uid) : false;
      const upvotes = issue.upvotes ?? 0;

      return (
      <div
        key={issue.id}
        data-testid="issue-row"
        data-issue-id={issue.id}
        className="grid md:grid-cols-[1fr_140px_140px] gap-4 items-center px-6 py-4 border-t border-white/5 text-slate-100"
      >
        <div>
          <p className="font-semibold">{issue.title}</p>
          <p className="text-xs text-slate-500 md:hidden">{issue.formattedDate}</p>
        </div>
        <div className="text-sm text-slate-300">{issue.category}</div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-start md:gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={issue.status} />
            <span className="text-xs text-slate-500 hidden md:inline">{issue.formattedDate}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleToggle(issue.id)}
              disabled={!user || upvoteLoadingId === issue.id}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-2xl border transition-colors ${
                hasUpvoted
                  ? 'border-emerald-400/50 text-emerald-200 bg-emerald-500/10'
                  : 'border-white/10 text-slate-300 hover:border-white/30'
              } ${!user ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp
                size={14}
                className={hasUpvoted ? 'fill-emerald-300 text-emerald-300' : 'text-slate-300'}
              />
              {upvoteLoadingId === issue.id ? 'Updating…' : upvotes}
            </button>
            <Link
              to={`/issues/${issue.id}`}
              data-testid="issue-open-link"
              className="text-xs text-blue-400 hover:text-blue-200 font-semibold"
            >
              Open details
            </Link>
          </div>
        </div>
      </div>
      );
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-400">Stay informed</p>
          <h1 className="text-3xl font-semibold text-white">Track your issues</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by ID or title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['All', IssueStatus.SUBMITTED, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as 'All' | IssueStatus)}
                className={`px-4 py-2 rounded-2xl text-sm font-medium border transition-colors ${
                  filter === status
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white/5 text-slate-300 border-white/5 hover:border-white/20'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_140px_140px] text-xs uppercase tracking-wide text-slate-400 px-6 py-3">
            <span>Title</span>
            <span>Category</span>
            <span>Status</span>
          </div>
          <div>{renderContent()}</div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default TrackIssues;
