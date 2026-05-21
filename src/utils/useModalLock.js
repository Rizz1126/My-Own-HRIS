import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a modal is open.
 * Prevents the background page from scrolling while a modal overlay is visible.
 */
export function useModalLock(isOpen) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);
}
