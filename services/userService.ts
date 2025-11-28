import { collection, doc, getDoc, getDocs, increment, limit, orderBy, query, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '../types';
import { evaluateBadges } from '../config/badges';

const USERS_COLLECTION = 'users';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  createdAt: string;
  fcmToken?: string | null;
  karma: number;
  reportsCount: number;
  upvoteImpact: number;
  badges: string[];
  phoneNumber?: string | null;
  phoneVerified?: boolean;
}

const withDefaults = (profile: Partial<UserProfile> & { uid: string }): UserProfile => ({
  uid: profile.uid,
  name: profile.name ?? '',
  email: profile.email ?? '',
  role: profile.role ?? 'citizen',
  departmentId: profile.departmentId ?? null,
  createdAt: profile.createdAt ?? new Date().toISOString(),
  fcmToken: profile.fcmToken ?? null,
  karma: profile.karma ?? 0,
  reportsCount: profile.reportsCount ?? 0,
  upvoteImpact: profile.upvoteImpact ?? 0,
  badges: profile.badges ?? [],
  phoneNumber: typeof profile.phoneNumber === 'string' ? profile.phoneNumber : null,
  phoneVerified: profile.phoneVerified ?? false,
});

export const createUserProfile = async (profile: UserProfile) => {
  const docRef = doc(db, USERS_COLLECTION, profile.uid);
  const payload = withDefaults(profile);
  await setDoc(docRef, payload, { merge: true });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    return null;
  }
  const data = snapshot.data();
  return withDefaults({
    uid: snapshot.id,
    name: data.name,
    email: data.email,
    role: data.role as UserRole,
    departmentId: data.departmentId,
    createdAt: data.createdAt,
    fcmToken: data.fcmToken,
    karma: data.karma,
    reportsCount: data.reportsCount,
    upvoteImpact: data.upvoteImpact,
    badges: data.badges,
    phoneNumber: data.phoneNumber,
    phoneVerified: data.phoneVerified,
  });
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
  return usersSnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return withDefaults({
      uid: docSnap.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      departmentId: data.departmentId,
      createdAt: data.createdAt,
      fcmToken: data.fcmToken,
      karma: data.karma,
      reportsCount: data.reportsCount,
      upvoteImpact: data.upvoteImpact,
      badges: data.badges,
      phoneNumber: data.phoneNumber,
      phoneVerified: data.phoneVerified,
    });
  });
};

export const updateUserRole = async (uid: string, role: UserRole) => {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, { role });
};

export const ensureUserProfile = async (profile: Partial<UserProfile> & { uid: string }): Promise<UserProfile> => {
  const existing = await getUserProfile(profile.uid);
  if (existing) {
    return existing;
  }

  const payload = withDefaults(profile);
  await setDoc(doc(db, USERS_COLLECTION, profile.uid), payload, { merge: true });
  return payload;
};

export const updateUserFcmToken = async (uid: string, token: string | null) => {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, { fcmToken: token });
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, updates);
};

export const incrementUserContribution = async (
  uid: string,
  { karmaDelta = 0, reportsDelta = 0 }: { karmaDelta?: number; reportsDelta?: number }
) => {
  if (karmaDelta) {
    await addKarma(uid, karmaDelta);
  }
  if (reportsDelta) {
    await adjustUserStats(uid, { reportsDelta });
  }
};

export const addKarma = async (uid: string, points: number) => {
  if (!points) {
    return;
  }

  const docRef = doc(db, USERS_COLLECTION, uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(docRef);
    if (!snapshot.exists()) {
      return;
    }

    const data = snapshot.data();
    const currentKarma = typeof data.karma === 'number' ? data.karma : 0;
    const nextKarma = Math.max(0, currentKarma + points);
    const reportsCount = typeof data.reportsCount === 'number' ? data.reportsCount : 0;
    const upvoteImpact = typeof data.upvoteImpact === 'number' ? data.upvoteImpact : 0;
    const badges = evaluateBadges({ karma: nextKarma, reportsCount, upvoteImpact });

    transaction.update(docRef, {
      karma: increment(points),
      badges,
    });

    if (nextKarma === 0 && currentKarma + points < 0) {
      transaction.update(docRef, { karma: 0 });
    }
  });
};

export const adjustUserStats = async (
  uid: string,
  {
    karmaDelta = 0,
    reportsDelta = 0,
    upvoteDelta = 0,
  }: { karmaDelta?: number; reportsDelta?: number; upvoteDelta?: number }
) => {
  if (!karmaDelta && !reportsDelta && !upvoteDelta) {
    return;
  }

  const docRef = doc(db, USERS_COLLECTION, uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(docRef);
    if (!snapshot.exists()) {
      return;
    }

    const data = snapshot.data();
    const nextStats = {
      karma: Math.max(0, (data.karma ?? 0) + karmaDelta),
      reportsCount: Math.max(0, (data.reportsCount ?? 0) + reportsDelta),
      upvoteImpact: Math.max(0, (data.upvoteImpact ?? 0) + upvoteDelta),
    };
    const badges = evaluateBadges(nextStats);

    transaction.update(docRef, {
      ...nextStats,
      badges,
    });
  });
};

export const getTopContributors = async (limitCount = 20): Promise<UserProfile[]> => {
  const topQuery = query(collection(db, USERS_COLLECTION), orderBy('karma', 'desc'), limit(limitCount));
  const snapshot = await getDocs(topQuery);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return withDefaults({
      uid: docSnap.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      departmentId: data.departmentId,
      createdAt: data.createdAt,
      fcmToken: data.fcmToken,
      karma: data.karma,
      reportsCount: data.reportsCount,
      upvoteImpact: data.upvoteImpact,
      badges: data.badges,
      phoneNumber: data.phoneNumber,
      phoneVerified: data.phoneVerified,
    });
  });
};
