import { useEffect, useRef, useState } from 'react';
import { computeStreak, hasLoggedToday } from '../../lib/stats';
import { useBoardStore } from '../../store/useBoardStore';
import { usePrefersReducedMotion } from '../ui/usePrefersReducedMotion';

const PULSE_MS = 500;

function StreakChip() {
  const applications = useBoardStore((s) => s.applications);
  const streak = computeStreak(applications);
  const filled = hasLoggedToday(applications);

  const [pulsing, setPulsing] = useState(false);
  const wasFilled = useRef(filled);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (filled && !wasFilled.current && !prefersReducedMotion) {
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), PULSE_MS);
      wasFilled.current = filled;
      return () => clearTimeout(timer);
    }
    wasFilled.current = filled;
  }, [filled, prefersReducedMotion]);

  return (
    <span
      className={`rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
        filled ? 'border-transparent text-on-action' : 'border-line text-muted'
      } ${pulsing ? 'streak-chip-pulse' : ''}`}
      style={filled ? { backgroundColor: 'var(--action)' } : undefined}
      aria-label={`${streak}-day activity streak${filled ? ', logged today' : ''}`}
      title={`${streak}-day activity streak${filled ? ' — logged today' : ' — log an application today to continue it'}`}
    >
      ▲ {streak}-day streak
    </span>
  );
}

export default StreakChip;
