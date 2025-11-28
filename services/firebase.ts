import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// 🔴 DISABLED FOR OTP FIX - Messaging causes PushManager token failures
// import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCWHlrAOsgjmHqLQSBJIOtXXaROU6biC0k',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'civicfix-821dd.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'civicfix-821dd',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'civicfix-821dd.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '944530057420',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:944530057420:web:7dc7343e17216a3308fa69',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? undefined,
};

// Initialize Firebase with reCAPTCHA Enterprise support
// Site Key: 6Lfp8BUsAAAAAAjA6o8l-q7LO42j1ejWztSkb9Sn (configured in Firebase Console)
const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
// 🔴 DISABLED FOR OTP FIX - Messaging causes PushManager token failures
// export const messagingPromise = isSupported().then((supported) => (supported ? getMessaging(firebaseApp) : null));

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

// 🔴 DISABLED - createRecaptcha() removed, now initialized inline in PhoneVerificationModal
// This ensures proper reCAPTCHA v2 (not Enterprise) initialization
/*
export const createRecaptcha = () => {
  try {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        'recaptcha-container',
        {
          size: 'invisible',
          'data-callback': (response: unknown) => console.log('reCAPTCHA solved:', response),
          'data-error-callback': (err: unknown) => console.error('reCAPTCHA error:', err),
        },
        auth
      );
      console.log('Recaptcha ready:', window.recaptchaVerifier);
    }
  } catch (err) {
    console.error('Recaptcha Error:', err);
  }
};
*/

export default firebaseApp;
