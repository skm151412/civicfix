import { captureException } from '../services/telemetry';
import { emitGlobalToast } from './toastBus';

type CivicFixError = {
  message: string;
  stack?: string;
  type: 'error' | 'promise';
  context?: string;
  timestamp: string;
};

type CivicFixWindow = Window & {
  __civicfixErrorReporterInstalled?: boolean;
  __civicfixErrorBuffer?: CivicFixError[];
};

const bufferLimit = 50;

const ignoredPromiseCodes = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]);

const getFriendlyMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('network')) {
    return 'Network looks unstable. Check your connection and try again.';
  }
  if (normalized.includes('permission') || normalized.includes('denied')) {
    return 'Looks like you do not have access to that action.';
  }
  return 'We could not finish that action. Please try again in a moment.';
};

const recordError = (win: CivicFixWindow, error: CivicFixError) => {
  if (!win.__civicfixErrorBuffer) {
    win.__civicfixErrorBuffer = [];
  }
  win.__civicfixErrorBuffer.push(error);
  if (win.__civicfixErrorBuffer.length > bufferLimit) {
    win.__civicfixErrorBuffer.shift();
  }
  try {
    sessionStorage.setItem('civicfix:lastErrors', JSON.stringify(win.__civicfixErrorBuffer));
  } catch (storageError) {
    console.warn('civicfix:error-storage-failed', storageError);
  }
  console.error('[civicfix-error]', error.message, error);

  const capturedError = new Error(error.message);
  capturedError.name = error.type === 'promise' ? 'CivicFixPromiseError' : 'CivicFixRuntimeError';
  if (error.stack) {
    capturedError.stack = error.stack;
  }
  captureException(capturedError, { context: error.context, timestamp: error.timestamp });
};

export const installErrorReporter = () => {
  if (typeof window === 'undefined') return;
  const win = window as CivicFixWindow;
  if (win.__civicfixErrorReporterInstalled) return;

  const handleWindowError = (event: ErrorEvent) => {
    recordError(win, {
      message: event.message,
      stack: event.error?.stack,
      type: 'error',
      context: `${event.filename ?? 'unknown'}:${event.lineno ?? 0}:${event.colno ?? 0}`,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = typeof reason === 'string' ? reason : reason?.message ?? 'Unknown promise rejection';
    const stack = typeof reason === 'object' ? reason?.stack : undefined;
    const reasonCode = typeof reason === 'object' ? (reason as { code?: string }).code : undefined;
    recordError(win, {
      message,
      stack,
      type: 'promise',
      context: 'unhandledrejection',
      timestamp: new Date().toISOString(),
    });
    if (!reasonCode || !ignoredPromiseCodes.has(reasonCode)) {
      emitGlobalToast({ message: getFriendlyMessage(message), variant: 'error' });
    }
  };

  win.addEventListener('error', handleWindowError);
  win.addEventListener('unhandledrejection', handleRejection);
  win.__civicfixErrorReporterInstalled = true;
};
