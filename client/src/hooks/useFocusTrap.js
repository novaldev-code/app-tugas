import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

export default function useFocusTrap({ active, onClose }) {
  const containerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const lastFocusedInsideRef = useRef(null);

  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  if (
    active &&
    previouslyFocusedRef.current === null &&
    typeof document !== 'undefined' &&
    document.activeElement instanceof HTMLElement
  ) {
    previouslyFocusedRef.current = document.activeElement;
  }

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    if (previouslyFocusedRef.current === null) {
      previouslyFocusedRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }

    const lastFocusedInside = lastFocusedInsideRef.current;
    lastFocusedInsideRef.current = null;

    const focusableElements = Array.from(
      container.querySelectorAll(FOCUSABLE_SELECTORS),
    ).filter((element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }
      if (element.getAttribute('aria-hidden') === 'true') {
        return false;
      }
      return element.offsetWidth > 0 || element.offsetHeight > 0 || element === container;
    });

    if (!container.contains(document.activeElement)) {
      const autoFocusElement = container.querySelector('[autofocus]');
      const initialFocus =
        lastFocusedInside && container.contains(lastFocusedInside)
          ? lastFocusedInside
          : autoFocusElement ?? focusableElements[0];

      if (initialFocus) {
        initialFocus.focus({ preventScroll: true });
      } else {
        container.focus({ preventScroll: true });
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const elements = Array.from(
        container.querySelectorAll(FOCUSABLE_SELECTORS),
      ).filter((element) => {
        if (!(element instanceof HTMLElement)) {
          return false;
        }
        if (element.getAttribute('aria-hidden') === 'true') {
          return false;
        }
        return element.offsetWidth > 0 || element.offsetHeight > 0;
      });

      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === first || !container.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      const activeElement = document.activeElement;
      lastFocusedInsideRef.current =
        activeElement instanceof HTMLElement && container.contains(activeElement)
          ? activeElement
          : null;

      const previous = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (previous && typeof previous.focus === 'function') {
        previous.focus({ preventScroll: true });
      }
    };
  }, [active]);

  return containerRef;
}
