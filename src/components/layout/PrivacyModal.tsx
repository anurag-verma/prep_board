import { useUiStore } from '../../store/useUiStore';
import Modal from '../ui/Modal';

/** Security doc §2's "Settings notice" + §3.3's "plain-language privacy
 * note" — both wanted this exact copy, so one modal satisfies both. */
function PrivacyModal() {
  const closeModal = useUiStore((s) => s.closePrivacyModal);

  return (
    <Modal onClose={closeModal} aria-label="Privacy">
      <div className="border-b border-line p-4">
        <h2 className="text-lg font-semibold">Privacy</h2>
      </div>

      <div className="flex flex-col gap-3 p-4 text-sm">
        <p className="font-medium">Everything stays on your device.</p>
        <p>
          PrepBoard has no server, no accounts, and sends nothing anywhere. Everything you
          enter — companies, notes, interview questions, contacts — is stored only in this
          browser's local storage. Nothing is ever transmitted, analyzed, or shared.
        </p>
        <p>
          On a shared or work computer, export a backup (Import/Export → Export JSON) and use{' '}
          <strong>Delete all data</strong> when you're done, so nothing is left behind.
        </p>
        <p className="text-muted">
          Clearing your browser's site data, or switching browsers/devices, also clears
          PrepBoard's data — export a backup first if you want to keep it.
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

export default PrivacyModal;
