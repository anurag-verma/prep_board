import { X } from 'lucide-react';
import { useBoardStore } from '../../store/useBoardStore';

function OnboardingBanner() {
  const loadSampleData = useBoardStore((s) => s.loadSampleData);
  const dismissOnboarding = useBoardStore((s) => s.dismissOnboarding);

  return (
    <div className="mx-4 mt-4 flex items-start justify-between gap-4 rounded-lg border border-line bg-surface p-4">
      <div>
        <p className="text-sm font-medium">Welcome to PrepBoard</p>
        <p className="mt-1 text-sm text-muted">
          Track applications on the board, log interview rounds, and drill your question bank —
          all stored locally in this browser. Not sure where to start?
        </p>
        <button
          type="button"
          onClick={loadSampleData}
          className="mt-3 rounded-md px-3 py-1.5 text-sm font-medium text-on-action"
          style={{ backgroundColor: 'var(--action)' }}
        >
          Load example board
        </button>
      </div>
      <button
        type="button"
        onClick={dismissOnboarding}
        aria-label="Dismiss welcome banner"
        title="Dismiss"
        className="shrink-0 rounded p-1 text-muted hover:bg-bg hover:text-ink"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default OnboardingBanner;
