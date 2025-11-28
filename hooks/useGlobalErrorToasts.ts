import { useEffect, useState } from 'react';
import { GlobalToastPayload, TOAST_EVENT } from '../utils/toastBus';

type ToastState = (GlobalToastPayload & { id?: string }) | null;

const useGlobalErrorToasts = () => {
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<GlobalToastPayload>;
      const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
      setToast({ ...customEvent.detail, id: uniqueId });
    };

    window.addEventListener(TOAST_EVENT, handler as EventListener);
    return () => window.removeEventListener(TOAST_EVENT, handler as EventListener);
  }, []);

  useEffect(() => {
    if (!toast || typeof window === 'undefined') {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return toast;
};

export default useGlobalErrorToasts;
