import type { ConfidenceRating } from '../../types/models';

interface ConfidenceDotsProps {
  confidence: ConfidenceRating;
}

function ConfidenceDots({ confidence }: ConfidenceDotsProps) {
  return (
    <span
      aria-label={`Confidence ${confidence} of 5`}
      title={`Confidence ${confidence} of 5`}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: n <= confidence ? 'var(--action)' : 'var(--line)' }}
        />
      ))}
    </span>
  );
}

export default ConfidenceDots;
