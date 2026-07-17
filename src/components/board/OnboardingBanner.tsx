import { BarChart3, KanbanSquare, MessagesSquare, Rocket, X } from 'lucide-react';
import { useBoardStore } from '../../store/useBoardStore';
import { useUiStore } from '../../store/useUiStore';

const STEPS = [
  {
    icon: KanbanSquare,
    title: '1. Track on the board',
    body: 'Add a company and role, then drag the card through stages as you hear back.',
  },
  {
    icon: MessagesSquare,
    title: '2. Log rounds & questions',
    body: 'Open a card to record interview rounds — questions asked go straight to your bank.',
  },
  {
    icon: BarChart3,
    title: '3. Watch your stats',
    body: 'Funnel, response rate, and streak update automatically as you go.',
  },
];

function OnboardingBanner() {
  const loadSampleData = useBoardStore((s) => s.loadSampleData);
  const dismissOnboarding = useBoardStore((s) => s.dismissOnboarding);
  const openAboutModal = useUiStore((s) => s.openAboutModal);

  return (
    <div
      className="relative mx-4 mt-4 overflow-hidden rounded-column border p-5"
      style={{
        borderColor: 'var(--action)',
        background: 'color-mix(in srgb, var(--action) 6%, var(--surface))',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: 'var(--action)' }}
      />

      <button
        type="button"
        onClick={dismissOnboarding}
        aria-label="Dismiss welcome banner"
        title="Dismiss"
        className="absolute right-3 top-3 shrink-0 rounded p-1 text-muted hover:bg-bg hover:text-ink"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--action)', color: 'var(--on-action)' }}
        >
          <Rocket size={18} />
        </span>
        <div>
          <p className="text-base font-semibold">Welcome to PrepBoard</p>
          <p className="mt-1 text-sm text-muted">
            Everything is stored locally in this browser — no account, no setup. Here's how the
            three pages fit together:
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex flex-col gap-1 rounded-card border border-line bg-surface p-3"
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Icon aria-hidden size={14} style={{ color: 'var(--action)' }} />
              {title}
            </span>
            <p className="text-xs text-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={loadSampleData}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-on-action"
          style={{ backgroundColor: 'var(--action)' }}
        >
          Load example board
        </button>
        <button
          type="button"
          onClick={openAboutModal}
          className="text-sm font-medium text-muted hover:text-ink"
        >
          What's PrepBoard for?
        </button>
      </div>
    </div>
  );
}

export default OnboardingBanner;
