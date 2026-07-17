import { useState } from 'react';
import { clearAllData } from '../../store/persistStorage';
import { useBoardStore } from '../../store/useBoardStore';
import { useQuestionStore } from '../../store/useQuestionStore';
import { useUiStore } from '../../store/useUiStore';
import { DEFAULT_STAGES } from '../../types/models';
import Modal from '../ui/Modal';

const CONFIRM_WORD = 'DELETE';

function DeleteAllDataModal() {
  const closeModal = useUiStore((s) => s.closeDeleteAllDataModal);
  const clearFilters = useUiStore((s) => s.clearFilters);
  const closeDetail = useUiStore((s) => s.closeDetail);
  const [confirmText, setConfirmText] = useState('');

  function handleDelete() {
    if (confirmText !== CONFIRM_WORD) return;

    clearAllData();
    useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
    useQuestionStore.setState({ questions: [] });
    closeDetail();
    clearFilters();
    closeModal();
  }

  return (
    <Modal onClose={closeModal} aria-label="Delete all data">
      <div className="border-b border-line p-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--danger)' }}>
          Delete all data
        </h2>
      </div>

      <div className="flex flex-col gap-3 p-4 text-sm">
        <p>
          This permanently erases every application, question, and stage from this browser.
          There is no undo — export a backup first if you want to keep anything.
        </p>

        <label className="flex flex-col gap-1">
          <span>
            Type <strong className="font-mono">{CONFIRM_WORD}</strong> to confirm:
          </span>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            aria-label={`Type ${CONFIRM_WORD} to confirm`}
            autoComplete="off"
            className="rounded border border-line bg-surface px-2 py-1.5 font-mono outline-none focus:border-action"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={confirmText !== CONFIRM_WORD}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-on-danger disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: 'var(--danger)' }}
          >
            Delete everything
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:bg-bg hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteAllDataModal;
