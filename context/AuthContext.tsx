import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
// 🔴 DISABLED FOR OTP FIX - Messaging causes PushManager token failures
// import { getToken } from 'firebase/messaging';
import { auth } from '../services/firebase';
// import { auth, messagingPromise } from '../services/firebase';
import { UserProfile, ensureUserProfile, getUserProfile, updateUserFcmToken } from '../services/userService';
import PhoneVerificationModal from '../components/PhoneVerificationModal';
import { UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isPhoneVerified: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  requirePhoneVerification: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: null,
  isPhoneVerified: false,
  loading: true,
  refreshProfile: async () => undefined,
  logout: async () => undefined,
  requirePhoneVerification: () => undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestedFcmFor, setRequestedFcmFor] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const loadProfile = async (uid: string, fallback: Partial<UserProfile> = {}) => {
    setLoading(true);
    try {
      const fetchedProfile = await getUserProfile(uid);
      if (fetchedProfile) {
        setProfile(fetchedProfile);
      } else {
        const ensured = await ensureUserProfile({ uid, ...fallback });
        setProfile(ensured);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? '',
          email: firebaseUser.email ?? '',
          role: 'citizen',
          phoneNumber: firebaseUser.phoneNumber ?? undefined,
          phoneVerified: Boolean(firebaseUser.phoneNumber),
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    await loadProfile(user.uid, {
      uid: user.uid,
      name: user.displayName ?? '',
      email: user.email ?? '',
      role: 'citizen',
      phoneNumber: user.phoneNumber ?? undefined,
      phoneVerified: Boolean(user.phoneNumber),
    });
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setRequestedFcmFor(null);
    setShowPhoneModal(false);
  };

  // 🔴 DISABLED FOR OTP FIX - FCM token registration causes PushManager failures
  // This was interfering with Phone Auth OTP delivery
  /*
  useEffect(() => {
    const registerFcmToken = async () => {
      if (!user || requestedFcmFor === user.uid) {
        return;
      }

      if (typeof window === 'undefined' || typeof Notification === 'undefined') {
        return;
      }

      const ensureServiceWorker = async () => {
        if (!('serviceWorker' in navigator)) {
          return undefined;
        }

        const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (existing) {
          return existing;
        }

        try {
          return await navigator.serviceWorker.register('/firebase-messaging-sw.js', { type: 'module' });
        } catch (err) {
          console.warn('Unable to register messaging service worker', err);
          return undefined;
        }
      };

      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setRequestedFcmFor(user.uid);
          return;
        }

        const messaging = await messagingPromise;
        if (!messaging) {
          console.warn('FCM is not supported in this browser.');
          setRequestedFcmFor(user.uid);
          return;
        }

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.warn('Missing VITE_FIREBASE_VAPID_KEY for push notifications.');
          setRequestedFcmFor(user.uid);
          return;
        }

        const serviceWorkerRegistration = await ensureServiceWorker();
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration,
        });
        if (token) {
          await updateUserFcmToken(user.uid, token);
        }
        setRequestedFcmFor(user.uid);
      } catch (err) {
        console.error('Unable to register FCM token', err);
      }
    };

    registerFcmToken();
  }, [user, requestedFcmFor]);
  */

  const isPhoneVerified = !!profile?.phoneVerified;
  const role = profile?.role ?? null;

  const requirePhoneVerification = () => {
    if (!user) return;
    setShowPhoneModal(true);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, role, isPhoneVerified, loading, refreshProfile, logout, requirePhoneVerification }),
    [user, profile, role, isPhoneVerified, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <PhoneVerificationModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onVerified={refreshProfile}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
