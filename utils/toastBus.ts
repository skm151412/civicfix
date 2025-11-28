export type GlobalToastPayload = {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
};

export const TOAST_EVENT = 'civicfix:toast';

export const emitGlobalToast = (payload: GlobalToastPayload) => {
  if (typeof window === 'undefined') {
    return;
  }

  const event = new CustomEvent<GlobalToastPayload>(TOAST_EVENT, {
    detail: {
      variant: 'info',
      ...payload,
    },
  });

  window.dispatchEvent(event);
};
