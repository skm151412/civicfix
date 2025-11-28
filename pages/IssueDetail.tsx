import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock3,
  Building2,
  Send,
  ThumbsUp,
  Share2,
  Copy,
  CircleDot,
  UserCheck,
  Hammer,
  CheckCircle2,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Toast from '../components/Toast';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import VerifiedBadge from '../components/VerifiedBadge';
import {
  IssueChatMessage,
  IssueRecord,
  IssueStatusStage,
  listenToIssue,
  listenToIssueChat,
  sendIssueChatMessage,
  toggleUpvoteIssue,
} from '../services/issueService';
import { useAuth } from '../context/AuthContext';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

const stageOrder: IssueStatusStage[] = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
const stageIcons: Record<IssueStatusStage, React.ComponentType<{ size?: number }>> = {
  Submitted: CircleDot,
  Assigned: UserCheck,
  'In Progress': Hammer,
  Resolved: CheckCircle2,
};

const stageDescriptions: Record<IssueStatusStage, string> = {
  Submitted: 'Issue entered the system.',
  Assigned: 'City staff claimed the issue.',
  'In Progress': 'Work is underway to fix it.',
  Resolved: 'Issue resolved and verified.',
};

const IssueDetail: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const [issue, setIssue] = useState<IssueRecord | null>(null);
  const [issueLoading, setIssueLoading] = useState(true);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [messages, setMessages] = useState<IssueChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const shareModalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!shareToast) return;
    const timer = window.setTimeout(() => setShareToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [shareToast]);

  useEffect(() => {
    if (!issueId) {
      setIssueLoading(false);
      setIssueError('Missing issue ID in route.');
      return;
    }

    setIssueLoading(true);
    const unsubscribe = listenToIssue(issueId, (record) => {
      if (!record) {
        setIssueError('We could not find this issue.');
        setIssue(null);
      } else {
        setIssue(record);
        setIssueError(null);
      }
      setIssueLoading(false);
    });

    return () => unsubscribe();
  }, [issueId]);

  useEffect(() => {
    if (!issueId) {
      setChatLoading(false);
      setChatError('Missing issue ID for chat.');
      return;
    }

    const unsubscribe = listenToIssueChat(issueId, (chatMessages) => {
      setMessages(chatMessages);
      setChatLoading(false);
    });

    return () => unsubscribe();
  }, [issueId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  useModalAccessibility(shareModalOpen, shareModalRef, {
    onClose: () => setShareModalOpen(false),
  });

  const formattedMeta = useMemo(() => {
    if (!issue) return null;
    const submitted = issue.createdAt.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${submitted} · ${issue.category}`;
  }, [issue]);

  const timelineItems = useMemo(
    () =>
      stageOrder.map((stage) => ({
        stage,
        entry: issue?.statusHistory.find((item) => item.stage === stage) ?? null,
      })),
    [issue]
  );

  const beforeImage = issue?.beforeImageUrl || issue?.imageUrl || '';
  const afterImage = issue?.afterImageUrl || issue?.resolutionImageUrl || '';

  const handleSendMessage = async () => {
    if (!issueId || !user || !profile) {
      setChatError('Sign in to chat with city staff.');
      return;
    }

    const trimmed = draftMessage.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      setChatError(null);
      await sendIssueChatMessage(issueId, {
        uid: user.uid,
        name: profile.name || user.displayName || user.email || 'Citizen',
        msg: trimmed,
      });
      setDraftMessage('');
    } catch (err) {
      console.error(err);
      setChatError('Unable to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const renderChatBody = () => {
    if (chatLoading) {
      return <div className="text-sm text-slate-400">Loading conversation…</div>;
    }

    if (chatError) {
      return <div className="text-sm text-red-400">{chatError}</div>;
    }

    if (!messages.length) {
      return <div className="text-sm text-slate-500">No messages yet. Start the conversation!</div>;
    }

    return messages.map((message) => {
      const isOwn = user?.uid === message.uid;
      const bubbleAlignment = isOwn ? 'items-end text-right' : 'items-start text-left';
      const bubbleClass = isOwn
        ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-50'
        : 'bg-slate-900/70 border border-white/5 text-slate-100';

      return (
        <div key={message.id} className={`flex flex-col ${bubbleAlignment}`}>
          <div className="text-[11px] text-slate-500 mb-1">
            {isOwn ? 'You' : message.name}{' '}
            <span className="text-slate-600">
              · {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className={`px-4 py-2 rounded-2xl text-sm shadow ${bubbleClass}`}>{message.msg}</div>
        </div>
      );
    });
  };

  const hasUpvoted = issue && user ? issue.upvotedBy?.includes(user.uid) : false;
  const upvoteCount = issue?.upvotes ?? 0;

  const handleToggleUpvote = async () => {
    if (!issueId || !user || !issue) {
      setIssueError('Sign in to support issues with upvotes.');
      return;
    }
    try {
      setUpvoteLoading(true);
      await toggleUpvoteIssue(issue.id, user.uid);
    } catch (err) {
      console.error(err);
      setIssueError('Unable to update upvote right now.');
    } finally {
      setUpvoteLoading(false);
    }
  };

  const handleShare = async () => {
    if (!issue) return;
    if (!shareUrl) {
      setShareModalOpen(true);
      return;
    }

    const sharePayload = {
      title: 'CivicFix – Public Issue',
      text: `Check this issue: ${issue.title}`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(sharePayload);
        return;
      } catch (err) {
        // User might cancel; only fallback if actual error
        if ((err as Error).name === 'AbortError') {
          return;
        }
        console.warn('Web Share API failed, using fallback', err);
      }
    }
    setShareModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        throw new Error('Clipboard not supported');
      }
      setShareToast('Link copied!');
      setShareModalOpen(false);
    } catch (err) {
      console.error('Unable to copy link', err);
      setShareToast('Unable to copy link. Please copy manually.');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to list
        </button>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="bg-white/5 border-white/10">
            {issueLoading ? (
              <div className="p-6 text-slate-400">Loading issue details…</div>
            ) : issue ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Issue detail</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold text-white">{issue.title}</h1>
                    {issue.phoneVerified && <VerifiedBadge />}
                  </div>
                  {formattedMeta && <p className="text-sm text-slate-400">{formattedMeta}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={issue.status} />
                  <button
                    type="button"
                    onClick={handleToggleUpvote}
                    disabled={upvoteLoading || !user}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm transition-colors ${
                      hasUpvoted
                        ? 'border-emerald-400/50 text-emerald-200 bg-emerald-500/10'
                        : 'border-white/10 text-slate-200 hover:border-white/30'
                    } ${!user ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <ThumbsUp size={16} className={hasUpvoted ? 'fill-emerald-300 text-emerald-300' : 'text-slate-300'} />
                    {upvoteLoading ? 'Updating…' : `${upvoteCount} Upvote${upvoteCount === 1 ? '' : 's'}`}
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 text-sm text-slate-200 hover:border-white/30 transition-colors"
                  >
                    <Share2 size={16} /> Share
                  </button>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{issue.description}</p>
                <div className="space-y-3 text-sm text-slate-300">
                  {issue.locationText && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-slate-400" />
                      {issue.locationText}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-slate-400" />
                    Created {issue.createdAt.toLocaleString()}
                  </div>
                  {issue.department && (
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400" />
                      {issue.department}
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">Status timeline</p>
                  <div className="relative pl-6">
                    <div className="absolute left-[10px] top-1 bottom-1 w-px bg-white/10" aria-hidden />
                    <div className="space-y-5">
                      {timelineItems.map(({ stage, entry }) => {
                        const Icon = stageIcons[stage];
                        const isCompleted = Boolean(entry);
                        const timestamp = entry?.changedAt.toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <div key={stage} className="relative pl-8">
                            <div
                              className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border text-xs font-semibold ${
                                isCompleted
                                  ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200'
                                  : 'bg-slate-900/60 border-white/10 text-slate-500'
                              }`}
                            >
                              <Icon size={14} />
                            </div>
                            <div
                              className={`rounded-2xl border px-4 py-3 transition-colors ${
                                isCompleted
                                  ? 'border-emerald-400/30 bg-emerald-500/5 text-white'
                                  : 'border-white/10 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                                <span>{stage}</span>
                                <span className="text-xs text-slate-400">{timestamp || 'Pending'}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {entry?.note || stageDescriptions[stage]}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {(beforeImage || afterImage) && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 uppercase tracking-[0.3em]">Visual evidence</p>
                    {beforeImage && afterImage ? (
                      <BeforeAfterSlider beforeSrc={beforeImage} afterSrc={afterImage} />
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {beforeImage && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500">Before</p>
                            <img
                              src={beforeImage}
                              alt={`${issue.title} before repair`}
                              className="w-full rounded-2xl border border-white/10 object-cover"
                            />
                          </div>
                        )}
                        {afterImage && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500">After</p>
                            <img
                              src={afterImage}
                              alt={`${issue.title} after repair`}
                              className="w-full rounded-2xl border border-white/10 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-red-400">{issueError || 'Issue not found.'}</div>
            )}
          </Card>

          <Card className="bg-slate-950/60 border-white/10 flex flex-col">
            <div className="pb-4 border-b border-white/5">
              <p className="text-xs tracking-[0.3em] text-slate-500">Chat</p>
              <h2 className="text-xl font-semibold text-white">Citizen ↔ Staff inbox</h2>
              <p className="text-sm text-slate-500">Coordinate updates in real-time.</p>
            </div>
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
              {renderChatBody()}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSendMessage();
              }}
              className="pt-4 border-t border-white/5 space-y-3"
            >
              <textarea
                rows={2}
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your update…"
                className="w-full rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {sending ? 'Sending…' : 'Press Enter to send, Shift+Enter for a new line.'}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-2"
                  disabled={sending || !draftMessage.trim()}
                  isLoading={sending}
                >
                  <Send size={16} /> Send
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
      {shareModalOpen && issue && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card
            ref={shareModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            aria-describedby="share-modal-description"
            className="w-full max-w-md bg-slate-900/90 border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Share issue</p>
                <h3 id="share-modal-title" className="text-xl text-white font-semibold">Copy & share</h3>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close share modal"
              >
                &times;
              </button>
            </div>
            <p id="share-modal-description" className="text-sm text-slate-400 mb-4">
              Send this link to neighbors or staff to raise visibility.
            </p>
            <div className="flex items-center gap-3 bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 mb-4">
              <span className="text-xs text-slate-500 truncate">{shareUrl}</span>
            </div>
            <Button className="w-full gap-2" onClick={handleCopyLink}>
              <Copy size={16} /> Copy link
            </Button>
          </Card>
        </div>
      )}
      {shareToast && (
        <div className="fixed bottom-6 right-6">
          <Toast message={shareToast} variant="info" />
        </div>
      )}
    </MainLayout>
  );
};

export default IssueDetail;
