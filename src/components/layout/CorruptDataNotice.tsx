import { AlertTriangle, X } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';

/** Security doc §2's "non-blocking notice" for corrupt-localStorage recovery
 * — the store already tracked this state (`corruptDataRecovered`,
 * `didRecoverFromCorruptData`) but no component ever rendered it, so a user
 * whose data got wiped by unreadable JSON was never told. `role="status"`
 * (polite, not assertive) since this is informational, not something that
 * needs to interrupt whatever the user is doing. */
function CorruptDataNotice() {
  const corruptDataRecovered = useUiStore((s) => s.corruptDataRecovered);
  const dismiss = useUiStore((s) => s.dismissCorruptDataNotice);

  if (!corruptDataRecovered) return null;

  return (
    <div
      role="status"
      className="mx-4 mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm"
      style={{ borderColor: 'var(--flag)', color: 'var(--flag-text)' }}
    >
      <AlertTriangle aria-hidden size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1">
        Your saved data couldn't be read (it may have been corrupted) and PrepBoard started fresh.
        A backup of the unreadable data was kept in this browser's storage in case you need it.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notice"
        title="Dismiss"
        className="shrink-0 rounded p-1 hover:opacity-70"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default CorruptDataNotice;
