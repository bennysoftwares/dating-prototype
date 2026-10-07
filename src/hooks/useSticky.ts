import { useRef } from 'react';

/**
 * Keeps the last defined value while `hold` is true. Used so a screen keeps showing a
 * person while a safety sheet finishes (after a block or unmatch removes them from the data).
 */
export function useSticky<T>(value: T | undefined, hold: boolean): T | undefined {
  const last = useRef(value);
  if (value !== undefined) last.current = value;
  return value ?? (hold ? last.current : undefined);
}
