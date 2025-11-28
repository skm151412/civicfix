import { IssuePayload } from './issueService';

const STORAGE_KEY = 'civicfix-offline-issues';

export interface OfflineIssueDraft {
  id: string;
  createdAt: number;
  payload: IssuePayload;
  image?: {
    name: string;
    type: string;
    dataUrl: string;
  };
}

const hasWindow = () => typeof window !== 'undefined' && !!window.localStorage;

const readQueue = (): OfflineIssueDraft[] => {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfflineIssueDraft[]) : [];
  } catch (err) {
    console.warn('Unable to read offline queue', err);
    return [];
  }
};

const writeQueue = (queue: OfflineIssueDraft[]) => {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Unable to persist offline queue', err);
  }
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert file to data URL'));
    reader.readAsDataURL(file);
  });

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const queueIssueDraft = async (payload: IssuePayload, file?: File | null) => {
  const queue = readQueue();
  let image: OfflineIssueDraft['image'];

  if (file) {
    try {
      const dataUrl = await fileToDataUrl(file);
      image = { name: file.name, type: file.type, dataUrl };
    } catch (err) {
      console.warn('Could not encode attachment for offline draft', err);
    }
  }

  const draft: OfflineIssueDraft = {
    id: generateId(),
    createdAt: Date.now(),
    payload,
    image,
  };

  queue.push(draft);
  writeQueue(queue);
  return draft;
};

export const getQueuedDrafts = (): OfflineIssueDraft[] => readQueue();

export const removeQueuedDraft = (id: string) => {
  const queue = readQueue().filter((draft) => draft.id !== id);
  writeQueue(queue);
};
