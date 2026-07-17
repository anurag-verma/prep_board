import { Download, Upload } from 'lucide-react';
import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { mergeById } from '../../lib/appDataMerge';
import { parseAndValidateQuestionBank, type QuestionBankData } from '../../lib/questionBankSchema';
import { SCHEMA_VERSION } from '../../lib/schema';
import { useQuestionStore } from '../../store/useQuestionStore';
import { usePopoverBehavior } from '../ui/usePopoverBehavior';

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function QuestionBankImportExportMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<QuestionBankData | null>(null);
  const [errors, setErrors] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const containerRef = usePopoverBehavior<HTMLDivElement>(menuOpen, closeMenu);

  function handleExport() {
    setMenuOpen(false);
    const data: QuestionBankData = {
      schemaVersion: SCHEMA_VERSION,
      questions: useQuestionStore.getState().questions,
    };
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadJson(data, `prepboard-questions-${timestamp}.json`);
  }

  function handleImportClick() {
    setErrors(null);
    setPendingImport(null);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const text = await readFileAsText(file);
    const result = parseAndValidateQuestionBank(text);
    if (!result.valid) {
      setErrors(result.errors);
      setPendingImport(null);
    } else {
      setErrors(null);
      setPendingImport(result.data);
    }
  }

  function handleReplace() {
    if (!pendingImport) return;
    if (
      window.confirm('Replace the ENTIRE question bank with the imported file? This cannot be undone.')
    ) {
      useQuestionStore.setState({ questions: pendingImport.questions });
      setPendingImport(null);
      setMenuOpen(false);
    }
  }

  function handleMerge() {
    if (!pendingImport) return;
    const current = useQuestionStore.getState().questions;
    useQuestionStore.setState({ questions: mergeById(current, pendingImport.questions) });
    setPendingImport(null);
    setMenuOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        className="rounded-md border border-line px-2.5 py-1.5 text-sm text-muted hover:bg-bg hover:text-ink"
      >
        Import/Export bank
      </button>

      {menuOpen && (
        <div
          role="group"
          aria-label="Import and export question bank options"
          className="absolute right-0 z-10 mt-1 w-72 rounded-md border border-line bg-surface p-2 [box-shadow:var(--shadow-popover)]"
        >
          <button
            type="button"
            onClick={handleExport}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-bg"
          >
            <Download size={14} /> Export bank JSON
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-bg"
          >
            <Upload size={14} /> Import bank JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            aria-label="Import question bank JSON file"
            onChange={handleFileSelected}
            className="hidden"
          />

          {errors && (
            <div
              className="mt-2 rounded border px-2 py-1.5 text-xs"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              <p className="font-medium">Import rejected:</p>
              <ul className="list-disc pl-4">
                {errors.slice(0, 5).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {pendingImport && (
            <div className="mt-2 flex flex-col gap-1.5 rounded border border-line p-2 text-xs">
              <p>Valid file: {pendingImport.questions.length} questions.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleMerge}
                  className="rounded-md px-2 py-1 text-xs font-medium text-on-action"
                  style={{ backgroundColor: 'var(--action)' }}
                >
                  Merge with existing
                </button>
                <button
                  type="button"
                  onClick={handleReplace}
                  className="rounded-md border border-line px-2 py-1 text-xs"
                  style={{ color: 'var(--danger)' }}
                >
                  Replace bank
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionBankImportExportMenu;
