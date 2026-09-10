import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay: number) {
  const [DEBOUNCED_VALUE, SET_DEBOUNCED_VALUE] = useState(value);
  useEffect(() => {
    const TIMER = window.setTimeout(() => SET_DEBOUNCED_VALUE(value), delay);
    return () => window.clearTimeout(TIMER);
  }, [delay, value]);
  return DEBOUNCED_VALUE;
}
