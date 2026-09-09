import { useEffect } from 'react';

export function ScreenRipple() {
  useEffect(() => {
    const ripples = new Set<HTMLElement>();
    const touch = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const ripple = document.createElement('span');
      ripple.className = 'screen-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.left = `${event.clientX - 5}px`;
      ripple.style.top = `${event.clientY - 5}px`;
      ripples.add(ripple);
      ripple.addEventListener('animationend', () => { ripple.remove(); ripples.delete(ripple); }, { once: true });
      document.body.appendChild(ripple);
    };
    document.addEventListener('pointerdown', touch);
    return () => { document.removeEventListener('pointerdown', touch); ripples.forEach(el => el.remove()); };
  }, []);
  return null;
}
