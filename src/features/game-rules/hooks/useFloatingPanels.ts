import { useCallback, useState } from 'react';

export type FloatingKey = 'score' | 'pirate';
interface Point { x: number; y: number; }
const FLOATING_GAP = 1;
const FLOATING_EDGE = 8;
const FLOATING_SNAP_DISTANCE = 16;

export function useFloatingPanels() {
  const [OPEN_KEYS, SET_OPEN_KEYS] = useState<FloatingKey[]>([]);
  const [POSITIONS, SET_POSITIONS] = useState<Record<FloatingKey, Point>>({ score: { x: 8, y: 8 }, pirate: { x: 8, y: 260 } });
  const [FOCUSED_KEY, SET_FOCUSED_KEY] = useState<FloatingKey | null>(null);
  const [PAIRED, SET_PAIRED] = useState(false);
  const show = (key: FloatingKey) => { SET_OPEN_KEYS(CURRENT => CURRENT.includes(key) ? CURRENT : [...CURRENT, key]); SET_FOCUSED_KEY(key); };
  const hide = (key: FloatingKey) => { SET_OPEN_KEYS(CURRENT => CURRENT.filter(ITEM => ITEM !== key)); SET_PAIRED(false); };
  const beginDrag = useCallback((key: FloatingKey, event: React.PointerEvent<HTMLElement>) => {
    const PANEL = event.currentTarget.parentElement as HTMLElement;
    const START = { x: event.clientX, y: event.clientY, left: PANEL.offsetLeft, top: PANEL.offsetTop };
    SET_FOCUSED_KEY(key); SET_PAIRED(false); event.currentTarget.setPointerCapture(event.pointerId);
    const MOVE = (moveEvent: PointerEvent) => {
      const MAX_X = Math.max(FLOATING_EDGE, window.innerWidth - PANEL.offsetWidth - FLOATING_EDGE);
      const MAX_Y = Math.max(FLOATING_EDGE, window.innerHeight - PANEL.offsetHeight - FLOATING_EDGE);
      SET_POSITIONS(CURRENT => ({ ...CURRENT, [key]: { x: Math.min(MAX_X, Math.max(FLOATING_EDGE, START.left + moveEvent.clientX - START.x)), y: Math.min(MAX_Y, Math.max(FLOATING_EDGE, START.top + moveEvent.clientY - START.y)) } }));
    };
    const END = () => {
      window.removeEventListener('pointermove', MOVE); window.removeEventListener('pointerup', END);
      const OTHER_KEY: FloatingKey = key === 'score' ? 'pirate' : 'score';
      const OTHER = document.querySelector<HTMLElement>(`[data-floating-panel="${OTHER_KEY}"]`);
      const CURRENT_PANEL = document.querySelector<HTMLElement>(`[data-floating-panel="${key}"]`);
      if (!OTHER || !CURRENT_PANEL) return;
      const FIRST_RECT = CURRENT_PANEL.getBoundingClientRect(); const SECOND_RECT = OTHER.getBoundingClientRect();
      const NEAR = FIRST_RECT.left < SECOND_RECT.right + FLOATING_SNAP_DISTANCE && FIRST_RECT.right > SECOND_RECT.left - FLOATING_SNAP_DISTANCE && FIRST_RECT.top < SECOND_RECT.bottom + FLOATING_SNAP_DISTANCE && FIRST_RECT.bottom > SECOND_RECT.top - FLOATING_SNAP_DISTANCE;
      if (NEAR) { SET_POSITIONS(CURRENT => ({ ...CURRENT, [key]: { x: Math.min(window.innerWidth - FIRST_RECT.width - FLOATING_EDGE, SECOND_RECT.left), y: Math.min(window.innerHeight - FIRST_RECT.height - FLOATING_EDGE, SECOND_RECT.bottom + FLOATING_GAP) } })); SET_PAIRED(true); }
    };
    window.addEventListener('pointermove', MOVE); window.addEventListener('pointerup', END, { once: true });
  }, []);
  return { OPEN_KEYS, POSITIONS, FOCUSED_KEY, PAIRED, show, hide, beginDrag };
}

