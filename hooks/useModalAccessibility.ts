import { RefObject, useEffect } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface UseModalAccessibilityOptions {
  onClose?: () => void;
}

export const useModalAccessibility = (
  isOpen: boolean,
  containerRef: RefObject<HTMLElement>,
  options: UseModalAccessibilityOptions = {}
) => {
  const { onClose } = options;

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFirstElement = () => {
      const focusable = containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
      focusable?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      );

      if (!focusableElements.length) {
        event.preventDefault();
        return;
      }

      const first = focusableElements[0] as HTMLElement | undefined;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement | undefined;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !containerRef.current.contains(active)) {
          event.preventDefault();
          last?.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    focusFirstElement();
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, containerRef, onClose]);
};
