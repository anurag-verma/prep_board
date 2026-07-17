import { useRef } from 'react';

/** Every real target browser implements `matchMedia`; jsdom needs the stub in
 * src/test/setup.ts. Read once per mount (a user changing the OS setting
 * mid-session and expecting a live update is an edge case not worth a
 * `change` listener for this app's scope). */
export function usePrefersReducedMotion(): boolean {
  return useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current;
}
