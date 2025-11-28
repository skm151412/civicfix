import { useCallback, useEffect, useState } from 'react';
import { createIssue } from '../services/issueService';
import { getQueuedDrafts, removeQueuedDraft, OfflineIssueDraft } from '../services/offlineQueue';

type ToastState = { message: string; variant: 'success' | 'error' } | null;

const dataUrlToFile = (image: NonNullable<OfflineIssueDraft['image']>) => {
  const [prefix, data] = image.dataUrl.split(',');
  const byteString = atob(data);
  const mimeMatch = prefix.match(/:(.*?);/);
  const mime = image.type || (mimeMatch ? mimeMatch[1] : 'application/octet-stream');
  const buffer = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    buffer[i] = byteString.charCodeAt(i);
  }
  return new File([buffer], image.name || 'attachment', { type: mime });
};

const useSyncOfflineIssues = () => {
  const [toast, setToast] = useState<ToastState>(null);
  const [syncing, setSyncing] = useState(false);

  const processQueue = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    const drafts = getQueuedDrafts();
    if (!drafts.length) {
      return;
    }

    setSyncing(true);
    for (const draft of drafts) {
      try {
        const file = draft.image ? dataUrlToFile(draft.image) : undefined;
        await createIssue(draft.payload, file);
        removeQueuedDraft(draft.id);
        setToast({ message: 'Offline report submitted.', variant: 'success' });
      } catch (err) {
        console.error('Failed to sync offline draft', err);
        setToast({ message: 'Failed to sync offline reports.', variant: 'error' });
        break;
      }
    }
    setSyncing(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    processQueue();
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, [processQueue]);

  useEffect(() => {
    if (!toast || typeof window === 'undefined') {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return { toast, syncing };
};

export default useSyncOfflineIssues;
