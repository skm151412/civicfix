import * as Sentry from '@sentry/browser';
import type { Analytics } from 'firebase/analytics';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import firebaseApp from './firebase';

export type CivicFixEvent = 'issue_created' | 'issue_resolved' | 'user_verified';

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

type FirebaseAppOptions = {
  measurementId?: string;
};

let sentryInitialized = false;
let analyticsPromise: Promise<Analytics | null> | null = null;

const bootstrapAnalytics = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (analyticsPromise) {
    return analyticsPromise;
  }
  const measurementId = (firebaseApp.options as FirebaseAppOptions).measurementId;
  if (!measurementId) {
    analyticsPromise = Promise.resolve(null);
    return analyticsPromise;
  }

  analyticsPromise = isSupported()
    .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
    .catch((err) => {
      console.warn('civicfix:analytics-init-failed', err);
      return null;
    });
  return analyticsPromise;
};

const normalizeParams = (params?: AnalyticsParams) => {
  if (!params) {
    return undefined;
  }

  return Object.entries(params).reduce<Record<string, string | number>>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }
    if (typeof value === 'boolean') {
      acc[key] = value ? 1 : 0;
    } else if (typeof value === 'number' || typeof value === 'string') {
      acc[key] = value;
    } else {
      acc[key] = String(value);
    }
    return acc;
  }, {});
};

const initializeSentry = () => {
  if (sentryInitialized || typeof window === 'undefined') {
    return;
  }
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    enabled: import.meta.env.PROD,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.05,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
  sentryInitialized = true;
};

export const initTelemetry = () => {
  initializeSentry();
  bootstrapAnalytics();
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  if (import.meta.env.DEV) {
    console.error('civicfix:capture-exception', error, context);
  }
  if (!sentryInitialized) {
    return;
  }

  if (error instanceof Error) {
    Sentry.captureException(error, { extra: context });
    return;
  }

  const fallbackError = new Error(typeof error === 'string' ? error : 'Unknown exception');
  Sentry.captureException(fallbackError, { extra: { ...context, rawError: error } });
};

export const trackEvent = (eventName: CivicFixEvent, params?: AnalyticsParams) => {
  const promise = bootstrapAnalytics();
  if (!promise) {
    return;
  }

  promise
    .then((analytics) => {
      if (!analytics) {
        return;
      }
      const normalized = normalizeParams(params);
      logEvent(analytics, eventName, normalized);
    })
    .catch((err) => {
      console.warn('civicfix:analytics-log-failed', err);
    });
};
