import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  DocumentData,
  QueryDocumentSnapshot,
  limit,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { IssueStatus } from '../types';
import { getDistanceMeters } from '../utils/distance';
import { computeBoundingBox, isWithinBoundingBox } from '../utils/geoQuery';
import { addKarma, adjustUserStats, incrementUserContribution } from './userService';
import { karmaRules } from '../config/karma';
import { trackEvent } from './telemetry';

const COLLECTION_NAME = 'issues';
const USERS_COLLECTION = 'users';

export class IssueSubmissionError extends Error {
  public code: 'storage-upload-failed' | 'firestore-write-failed';
  public cause?: unknown;

  constructor(code: 'storage-upload-failed' | 'firestore-write-failed', message: string, cause?: unknown) {
    super(message);
    this.name = 'IssueSubmissionError';
    this.code = code;
    this.cause = cause;
  }
}

export interface IssuePayload {
  title: string;
  description: string;
  category: string;
  locationText: string;
  lat: number;
  lng: number;
  userId: string;
  department?: string;
  phoneVerified: boolean;
  aadharNumber?: string;
  aadharImageUrl?: string;
  fullAddress: string;
  street?: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
}

export interface IssueRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  status: IssueStatus;
  userId: string;
  phoneVerified: boolean;
  aadharNumber?: string;
  aadharImageUrl?: string;
  location?: string;
  locationText: string;
  fullAddress: string;
  street?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  department: string;
  createdAt: Date;
  updatedAt?: Date;
  staffId?: string;
  upvotes: number;
  upvotedBy: string[];
  statusHistory: IssueStatusHistoryEntry[];
  imageUrl?: string;
  resolutionImageUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

export interface IssueChatMessage {
  id: string;
  uid: string;
  name: string;
  msg: string;
  createdAt: Date;
}

export interface IssueChatPayload {
  uid: string;
  name: string;
  msg: string;
}

export type IssueStatusStage = 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved';

type FirestoreTimestampValue = Timestamp | ReturnType<typeof serverTimestamp>;

export interface IssueStatusHistoryEntry {
  stage: IssueStatusStage;
  status?: IssueStatus;
  changedBy: string;
  changedAt: Date;
  note?: string;
}

interface IssueStatusHistoryEntryFirestore {
  stage?: IssueStatusStage;
  status?: IssueStatus;
  changedBy?: string;
  changedAt?: FirestoreTimestampValue;
  note?: string;
}

const resolveDepartment = (category: string) => {
  switch (category) {
    case 'Garbage':
      return 'Sanitation';
    case 'Streetlight':
      return 'Electrical';
    default:
      return 'General';
  }
};

const normalizeHistory = (
  entries: IssueStatusHistoryEntryFirestore[] | undefined,
  fallback: { stage: IssueStatusStage; status?: IssueStatus; changedBy: string; at: Date; note?: string }[]
): IssueStatusHistoryEntry[] => {
  const mapped = (entries ?? []).map((entry) => ({
    stage: entry.stage ?? 'Submitted',
    status: entry.status,
    changedBy: entry.changedBy ?? '',
    changedAt: entry.changedAt instanceof Timestamp ? entry.changedAt.toDate() : new Date(),
    note: entry.note ?? '',
  }));

  if (!mapped.length) {
    return fallback.map((item) => ({
      stage: item.stage,
      status: item.status,
      changedBy: item.changedBy,
      changedAt: item.at,
      note: item.note,
    }));
  }

  return mapped.sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());
};

const mapIssueData = (id: string, data: DocumentData | undefined): IssueRecord => {
  const safeData = data ?? {};
  const createdAtValue = safeData.createdAt instanceof Timestamp ? safeData.createdAt.toDate() : new Date();
  const updatedAtValue = safeData.updatedAt instanceof Timestamp ? safeData.updatedAt.toDate() : undefined;
  const fallbackHistory: { stage: IssueStatusStage; status?: IssueStatus; changedBy: string; at: Date; note?: string }[] = [
    {
      stage: 'Submitted',
      status: IssueStatus.SUBMITTED,
      changedBy: safeData.userId || '',
      at: createdAtValue,
      note: 'Issue submitted',
    },
  ];

  const beforeImageUrl = safeData.beforeImageUrl || safeData.imageUrl || '';
  const afterImageUrl = safeData.afterImageUrl || safeData.resolutionImageUrl || '';
  const fullAddress = safeData.fullAddress || safeData.locationText || safeData.location || '';
  const street = safeData.street || '';
  const locality = safeData.locality || '';
  const city = safeData.city || '';
  const region = safeData.state || safeData.region || '';
  const pincode = safeData.pincode || safeData.postalCode || '';
  const country = safeData.country || '';
  const landmark = safeData.landmark || '';

  if (safeData.status === IssueStatus.IN_PROGRESS) {
    fallbackHistory.push({
      stage: 'In Progress',
      status: IssueStatus.IN_PROGRESS,
      changedBy: safeData.staffId || '',
      at: updatedAtValue ?? createdAtValue,
      note: 'Issue being worked on',
    });
  } else if (safeData.status === IssueStatus.RESOLVED) {
    fallbackHistory.push({
      stage: 'In Progress',
      status: IssueStatus.IN_PROGRESS,
      changedBy: safeData.staffId || '',
      at: createdAtValue,
      note: 'Issue being worked on',
    });
    fallbackHistory.push({
      stage: 'Resolved',
      status: IssueStatus.RESOLVED,
      changedBy: safeData.staffId || '',
      at: updatedAtValue ?? createdAtValue,
      note: 'Issue resolved',
    });
  }

  const statusHistory = normalizeHistory(safeData.statusHistory, fallbackHistory);

  return {
    id,
    title: safeData.title || '',
    description: safeData.description || '',
    category: safeData.category || '',
    status: (safeData.status as IssueStatus) || IssueStatus.SUBMITTED,
    userId: safeData.userId || '',
    phoneVerified: Boolean(safeData.phoneVerified),
    location: safeData.location || safeData.locationText || '',
    locationText: safeData.locationText || safeData.location || '',
    fullAddress,
    street: street || undefined,
    locality: locality || undefined,
    city: city || undefined,
    state: region || undefined,
    pincode: pincode || undefined,
    country: country || undefined,
    landmark: landmark || undefined,
    lat: typeof safeData.lat === 'number' ? safeData.lat : undefined,
    lng: typeof safeData.lng === 'number' ? safeData.lng : undefined,
    department: safeData.department || resolveDepartment(safeData.category || ''),
    createdAt: createdAtValue,
    updatedAt: updatedAtValue,
    staffId: safeData.staffId,
    upvotes: typeof safeData.upvotes === 'number' ? safeData.upvotes : 0,
    upvotedBy: Array.isArray(safeData.upvotedBy) ? safeData.upvotedBy : [],
    statusHistory,
    imageUrl: beforeImageUrl,
    resolutionImageUrl: afterImageUrl,
    beforeImageUrl,
    afterImageUrl,
    aadharNumber: safeData.aadharNumber,
    aadharImageUrl: safeData.aadharImageUrl,
  };
};

const mapIssueDoc = (doc: QueryDocumentSnapshot<DocumentData>): IssueRecord => mapIssueData(doc.id, doc.data());

export const createIssue = async (payload: IssuePayload, file?: File | null, aadharFile?: File | null): Promise<string> => {
  const department = payload.department ?? resolveDepartment(payload.category);
  let beforeImageUrl = '';
  let aadharImageUrl = '';
  const reporterVerified = Boolean(payload.phoneVerified);
  let uploadedFileRef: ReturnType<typeof ref> | null = null;
  let uploadedAadharRef: ReturnType<typeof ref> | null = null;
  const resolvedAddress = (payload.fullAddress || payload.locationText).trim();

  if (file) {
    try {
      const uploaderUid = auth.currentUser?.uid ?? payload.userId;
      const filePath = `issue-images/${uploaderUid}/${Date.now()}-${file.name}`;
      uploadedFileRef = ref(storage, filePath);
      await uploadBytes(uploadedFileRef, file);
      beforeImageUrl = await getDownloadURL(uploadedFileRef);
    } catch (err) {
      console.error('Issue photo upload failed', err);
      throw new IssueSubmissionError('storage-upload-failed', 'Photo upload failed. Please retry or remove the attachment.', err);
    }
  }

  if (aadharFile) {
    try {
      const uploaderUid = auth.currentUser?.uid ?? payload.userId;
      const filePath = `aadhar-images/${uploaderUid}/${Date.now()}-${aadharFile.name}`;
      uploadedAadharRef = ref(storage, filePath);
      await uploadBytes(uploadedAadharRef, aadharFile);
      aadharImageUrl = await getDownloadURL(uploadedAadharRef);
    } catch (err) {
      console.error('Aadhaar upload failed', err);
      // If main photo uploaded but aadhaar failed, we might want to cleanup main photo?
      // For now, let's just throw.
      if (uploadedFileRef) {
         try { await deleteObject(uploadedFileRef); } catch (e) { /* ignore */ }
      }
      throw new IssueSubmissionError('storage-upload-failed', 'Aadhaar upload failed. Please retry.', err);
    }
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...payload,
      location: resolvedAddress,
      locationText: resolvedAddress,
      fullAddress: resolvedAddress,
      street: payload.street ?? '',
      locality: payload.locality ?? '',
      city: payload.city ?? '',
      state: payload.state ?? '',
      pincode: payload.pincode ?? '',
      country: payload.country ?? '',
      landmark: payload.landmark ?? '',
      lat: payload.lat,
      lng: payload.lng,
      department,
      phoneVerified: reporterVerified,
      status: IssueStatus.SUBMITTED,
      imageUrl: beforeImageUrl,
      beforeImageUrl,
      afterImageUrl: '',
      aadharImageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      staffId: '',
      resolutionImageUrl: '',
      upvotes: 0,
      upvotedBy: [],
      statusHistory: [
        {
          stage: 'Submitted',
          status: IssueStatus.SUBMITTED,
          changedBy: payload.userId,
          changedAt: Timestamp.now(),
          note: 'Issue submitted',
        },
      ],
    });

    trackEvent('issue_created', {
      category: payload.category,
      department,
      phone_verified: reporterVerified,
    });

    return docRef.id;
  } catch (err) {
    if (uploadedFileRef) {
      try {
        await deleteObject(uploadedFileRef);
      } catch (cleanupError) {
        console.warn('Unable to clean up failed upload asset', cleanupError);
      }
    }
    if (uploadedAadharRef) {
      try {
        await deleteObject(uploadedAadharRef);
      } catch (cleanupError) {
        console.warn('Unable to clean up failed aadhaar asset', cleanupError);
      }
    }
    console.error('Issue creation failed', err);
    throw new IssueSubmissionError('firestore-write-failed', 'Unable to save your issue right now. Please try again.', err);
  }
};

export const getUserIssues = async (userId: string): Promise<IssueRecord[]> => {
  const issuesQuery = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(issuesQuery);
  return snapshot.docs.map(mapIssueDoc);
};

export const listenToUserIssues = (
  userId: string,
  callback: (issues: IssueRecord[]) => void
): Unsubscribe => {
  const issuesQuery = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(issuesQuery, (snapshot) => {
    const records = snapshot.docs.map(mapIssueDoc);
    callback(records);
  });
};

export const listenToAssignedIssues = (
  staffId: string,
  callback: (issues: IssueRecord[]) => void
): Unsubscribe => {
  const assignedStatuses: IssueStatus[] = [IssueStatus.SUBMITTED, IssueStatus.IN_PROGRESS];
  const assignedQuery = query(
    collection(db, COLLECTION_NAME),
    where('status', 'in', assignedStatuses),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(assignedQuery, (snapshot) => {
    const records = snapshot.docs
      .map(mapIssueDoc)
      .filter((issue) => issue.status === IssueStatus.SUBMITTED || issue.staffId === staffId);
    callback(records);
  });
};

export const listenToAllIssues = (
  callback: (issues: IssueRecord[]) => void
): Unsubscribe => {
  const issuesQuery = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(issuesQuery, (snapshot) => {
    callback(snapshot.docs.map(mapIssueDoc));
  });
};

export const updateIssueStatus = async (
  issueId: string,
  newStatus: IssueStatus,
  staffId: string,
  file?: File | null,
  staffName?: string
) => {
  const issueRef = doc(db, COLLECTION_NAME, issueId);
  const issueSnapshot = await getDoc(issueRef);
  const issueData = issueSnapshot.exists() ? issueSnapshot.data() : null;

  const updates: Record<string, unknown> = {
    status: newStatus,
    updatedAt: serverTimestamp(),
    staffId,
  };

  const existingStages = new Set<string>(
    Array.isArray(issueData?.statusHistory)
      ? (issueData?.statusHistory as IssueStatusHistoryEntryFirestore[]).map((entry) => entry.stage ?? '')
      : []
  );
  const historyEntries: IssueStatusHistoryEntryFirestore[] = [];
  const actorLabel = staffName?.trim() ? staffName : 'City Staff';

  const queueHistory = (stage: IssueStatusStage, note: string, overrideStatus?: IssueStatus) => {
    if (existingStages.has(stage)) {
      return;
    }
    historyEntries.push({
      stage,
      status: overrideStatus ?? newStatus,
      changedBy: staffId,
      note,
      changedAt: Timestamp.now(),
    });
  };

  if (newStatus === IssueStatus.IN_PROGRESS) {
    queueHistory('Assigned', `Assigned to ${actorLabel}`, IssueStatus.IN_PROGRESS);
    queueHistory('In Progress', `${actorLabel} started work`, IssueStatus.IN_PROGRESS);
  }

  if (newStatus === IssueStatus.RESOLVED) {
    queueHistory('Assigned', `Assigned to ${actorLabel}`, IssueStatus.IN_PROGRESS);
    queueHistory('In Progress', `${actorLabel} started work`, IssueStatus.IN_PROGRESS);
    queueHistory('Resolved', `${actorLabel} resolved the issue`, IssueStatus.RESOLVED);
  }

  if (historyEntries.length) {
    updates.statusHistory = arrayUnion(...historyEntries);
  }

  if (file) {
    const storageRef = ref(storage, `issue-resolutions/${issueId}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    updates.resolutionImageUrl = downloadUrl;
    updates.afterImageUrl = downloadUrl;
  }

  if (newStatus === IssueStatus.RESOLVED && !updates.afterImageUrl) {
    throw new Error('An after image is required to resolve this issue.');
  }

  await updateDoc(issueRef, updates);

  if (newStatus === IssueStatus.RESOLVED) {
    trackEvent('issue_resolved', {
      issue_id: issueId,
      staff_id: staffId,
    });
  }

  if (issueData?.userId && issueData?.title) {
    await sendIssueStatusNotification(issueData.title, newStatus, issueData.userId as string);
  }

  if (issueData?.userId && newStatus === IssueStatus.RESOLVED) {
    try {
      await incrementUserContribution(issueData.userId as string, { reportsDelta: 1 });
      await addKarma(issueData.userId as string, karmaRules.resolvedReport);
    } catch (err) {
      console.warn('Unable to increment user karma', err);
    }
  }
};

export const getAllIssues = async (): Promise<IssueRecord[]> => {
  const issuesQuery = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(issuesQuery);
  return snapshot.docs.map(mapIssueDoc);
};

export const getIssueById = async (issueId: string): Promise<IssueRecord | null> => {
  const issueRef = doc(db, COLLECTION_NAME, issueId);
  const snapshot = await getDoc(issueRef);
  if (!snapshot.exists()) {
    return null;
  }
  return mapIssueData(snapshot.id, snapshot.data());
};

export const listenToIssue = (
  issueId: string,
  callback: (issue: IssueRecord | null) => void
): Unsubscribe => {
  const issueRef = doc(db, COLLECTION_NAME, issueId);
  return onSnapshot(issueRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(mapIssueData(snapshot.id, snapshot.data()));
  });
};

export const toggleUpvoteIssue = async (issueId: string, userId: string) => {
  const issueRef = doc(db, COLLECTION_NAME, issueId);
  let delta = 0;
  let ownerId: string | null = null;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(issueRef);
    if (!snapshot.exists()) {
      throw new Error('Issue not found');
    }

    const data = snapshot.data();
    ownerId = typeof data.userId === 'string' ? data.userId : null;
    const currentUpvotes = typeof data.upvotes === 'number' ? data.upvotes : 0;
    const upvotedBy = Array.isArray(data.upvotedBy) ? (data.upvotedBy as string[]) : [];

    if (upvotedBy.includes(userId)) {
      const updated = upvotedBy.filter((uid) => uid !== userId);
      transaction.update(issueRef, {
        upvotes: Math.max(0, currentUpvotes - 1),
        upvotedBy: updated,
      });
      delta = -1;
    } else {
      transaction.update(issueRef, {
        upvotes: currentUpvotes + 1,
        upvotedBy: [...upvotedBy, userId],
      });
      delta = 1;
    }
  });

  if (ownerId && delta !== 0) {
    try {
      await adjustUserStats(ownerId, { upvoteDelta: delta });
      if (karmaRules.upvoteReceived) {
        await addKarma(ownerId, delta * karmaRules.upvoteReceived);
      }
    } catch (err) {
      console.warn('Unable to update user badges for upvotes', err);
    }
  }

  if (delta !== 0 && karmaRules.upvoteGiven) {
    try {
      await addKarma(userId, delta * karmaRules.upvoteGiven);
    } catch (err) {
      console.warn('Unable to update voter karma for upvotes', err);
    }
  }
};

interface DuplicateSearchParams {
  category: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
  minutesWindow?: number;
}

export const findNearbyDuplicateIssue = async ({
  category,
  lat,
  lng,
  radiusMeters = 60,
  minutesWindow = 60,
}: DuplicateSearchParams): Promise<IssueRecord | null> => {
  const center = { lat, lng };
  const bounds = computeBoundingBox(center, radiusMeters);
  const cutoff = Timestamp.fromMillis(Date.now() - minutesWindow * 60 * 1000);

  const recentIssuesQuery = query(
    collection(db, COLLECTION_NAME),
    where('category', '==', category),
    where('createdAt', '>=', cutoff),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  const snapshot = await getDocs(recentIssuesQuery);
  const candidates = snapshot.docs
    .map(mapIssueDoc)
    .filter((issue) => issue.status !== IssueStatus.RESOLVED)
    .filter((issue) => typeof issue.lat === 'number' && typeof issue.lng === 'number')
    .filter((issue) =>
      isWithinBoundingBox(
        { lat: issue.lat as number, lng: issue.lng as number },
        bounds
      )
    );

  let closest: { issue: IssueRecord; distance: number } | null = null;
  for (const issue of candidates) {
    const coords = { lat: issue.lat as number, lng: issue.lng as number };
    const distance = getDistanceMeters(center, coords);
    if (distance <= radiusMeters) {
      if (!closest || distance < closest.distance) {
        closest = { issue, distance };
      }
    }
  }

  return closest?.issue ?? null;
};

export const listenToIssueChat = (
  issueId: string,
  callback: (messages: IssueChatMessage[]) => void
): Unsubscribe => {
  const chatRef = collection(db, COLLECTION_NAME, issueId, 'chats');
  const chatQuery = query(chatRef, orderBy('createdAt', 'asc'));

  return onSnapshot(chatQuery, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid || '',
        name: data.name || 'Unknown',
        msg: data.msg || '',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      } as IssueChatMessage;
    });
    callback(messages);
  });
};

export const sendIssueChatMessage = async (issueId: string, payload: IssueChatPayload) => {
  const trimmed = payload.msg.trim();
  if (!trimmed) {
    return;
  }

  await addDoc(collection(db, COLLECTION_NAME, issueId, 'chats'), {
    uid: payload.uid,
    name: payload.name,
    msg: trimmed,
    createdAt: serverTimestamp(),
  });
};

const sendIssueStatusNotification = async (title: string, status: IssueStatus, userId: string) => {
  try {
    const userSnapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (!userSnapshot.exists()) {
      return;
    }

    const userData = userSnapshot.data();
    const token = userData?.fcmToken;
    if (!token) {
      return;
    }

    const serverKey = import.meta.env.VITE_FIREBASE_SERVER_KEY;
    if (!serverKey) {
      console.warn('VITE_FIREBASE_SERVER_KEY is not set; skipping push notification.');
      return;
    }

    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${serverKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: 'Issue Updated',
          body: `${title} is now ${status}`,
        },
      }),
    });
  } catch (error) {
    console.error('Unable to send issue update notification', error);
  }
};
