import { useUiStore } from '../../store/useUiStore';
import Modal from '../ui/Modal';

function AboutModal() {
  const closeModal = useUiStore((s) => s.closeAboutModal);

  return (
    <Modal onClose={closeModal} aria-label="About PrepBoard">
      <div className="border-b border-line p-4">
        <h2 className="text-lg font-semibold">About PrepBoard</h2>
      </div>

      <div className="flex flex-col gap-3 p-4 text-sm">
        <p className="font-medium">Track your job search without a spreadsheet.</p>
        <p>
          PrepBoard is a kanban board for job applications: drag companies through stages,
          log interview rounds, and keep a bank of practice questions with confidence
          ratings so you know what to review before the next call.
        </p>
        <ul className="list-disc pl-5 text-muted">
          <li>
            <span className="text-ink">Board</span> — applications as cards, moved through
            stages you define.
          </li>
          <li>
            <span className="text-ink">Questions</span> — a searchable bank of interview
            questions with a practice mode.
          </li>
          <li>
            <span className="text-ink">Stats</span> — funnel, response rate, streak, and
            stale-application tracking.
          </li>
        </ul>
        <p className="text-muted">
          Everything is stored locally in this browser — see Settings → Privacy for details.
        </p>
      </div>

      <div className="flex justify-end border-t border-line p-4">
        <button
          type="button"
          onClick={closeModal}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-on-action"
          style={{ backgroundColor: 'var(--action)' }}
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}

export default AboutModal;
