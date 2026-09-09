import { useEffect } from 'react';

export function useScreenRipple() {
  useEffect(() => {
    const ACTIVE_RIPPLES = new Set<HTMLElement>();
    const HANDLE_POINTER = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const RIPPLE = document.createElement('span');
      RIPPLE.className = 'screen-ripple';
      RIPPLE.style.left = `${event.clientX - 5}px`;
      RIPPLE.style.top = `${event.clientY - 5}px`;
      RIPPLE.setAttribute('aria-hidden', 'true');
      ACTIVE_RIPPLES.add(RIPPLE);
      RIPPLE.addEventListener('animationend', () => {
        RIPPLE.remove();
        ACTIVE_RIPPLES.delete(RIPPLE);
      }, { once: true });
      document.body.appendChild(RIPPLE);
    };
    document.addEventListener('pointerdown', HANDLE_POINTER);
    return () => {
      document.removeEventListener('pointerdown', HANDLE_POINTER);
      ACTIVE_RIPPLES.forEach(RIPPLE => RIPPLE.remove());
    };
  }, []);
}

