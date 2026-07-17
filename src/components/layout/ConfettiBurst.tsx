import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { usePrefersReducedMotion } from '../ui/usePrefersReducedMotion';

const PIECE_COUNT = 24;
const BURST_MS = 1000;
const COLORS = [
  'var(--action)',
  'var(--flag)',
  'var(--stage-applied)',
  'var(--stage-oa)',
  'var(--stage-interviewing)',
];

interface Piece {
  id: number;
  left: number;
  delayMs: number;
  color: string;
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delayMs: Math.random() * 150,
    color: COLORS[i % COLORS.length],
  }));
}

function ConfettiBurst() {
  const celebration = useUiStore((s) => s.celebration);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const isFirstRender = useRef(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (celebration === 0 || prefersReducedMotion) return;

    setPieces(makePieces());
    const timer = setTimeout(() => setPieces([]), BURST_MS);
    return () => clearTimeout(timer);
  }, [celebration, prefersReducedMotion]);

  if (pieces.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-32 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece absolute top-0 h-2.5 w-2.5 rounded-sm"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delayMs}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default ConfettiBurst;
