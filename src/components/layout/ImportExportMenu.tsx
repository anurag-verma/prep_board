import { Download, Upload } from 'lucide-react';
import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { mergeAppData } from '../../lib/appDataMerge';
import { parseAndValidateAppData } from '../../lib/appDataSchema';
import { applicationsToCsv } from '../../lib/csv';
import { SCHEMA_VERSION } from '../../lib/schema';
import { useBoardStore } from '../../store/useBoardStore';
import { useQuestionStore } from '../../store/useQuestionStore';
import type { AppData } from '../../types/models';
import { usePopoverBehavior } from '../ui/usePopoverBehavior';

function getCurrentAppData(): AppData {
  const board = useBoardStore.getState();
  const questions = useQuestionStore.getState();
  return {
    schemaVersion: SCHEMA_VERSION,
    stages: board.stages,
    applications: board.applications,
    questions: questions.questions,
  };
}

function applyAppData(data: AppData) {
  useBoardStore.setState({ stages: data.stages, applications: data.applications });
  useQuestionStore.setState({ questions: data.questions });
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(csv: string, filename: string) {
  // UTF-8 BOM so Excel detects the encoding correctly instead of guessing
  // the system locale (garbles accented characters otherwise).
  const BOM = String.fromCharCode(0xfeff);
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ImportExportMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [errors, setErrors] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const containerRef = usePopoverBehavior<HTMLDivElement>(menuOpen, closeMenu);

  function handleExport() {
    setMenuOpen(false);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadJson(getCurrentAppData(), `prepboard-export-${timestamp}.json`);
  }

  function handleExportCsv() {
    setMenuOpen(false);
    const board = useBoardStore.getState();
    const csv = applicationsToCsv(board.stages, board.applications);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `prepboard-applications-${timestamp}.csv`);
  }

  function handleImportClick() {
    setErrors(null);
    setPendingImport(null);
    fileInputRef.current?.click();
  }

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file again later
    if (!file) return;

    const text = await readFileAsText(file);
    const result = parseAndValidateAppData(text);
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
      window.confirm('Replace ALL current data with the imported file? This cannot be undone.')
    ) {
      applyAppData(pendingImport);
      setPendingImport(null);
      setMenuOpen(false);
    }
  }

  function handleMerge() {
    if (!pendingImport) return;
    applyAppData(mergeAppData(getCurrentAppData(), pendingImport));
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
        Import/Export
      </button>

      {menuOpen && (
        <div
          role="group"
          aria-label="Import and export options"
          className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-line bg-surface p-2 [box-shadow:var(--shadow-popover)]"
        >
          <button
            type="button"
            onClick={handleExport}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-bg"
          >
            <Download size={14} /> Export JSON
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-bg"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-bg"
          >
            <Upload size={14} /> Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            aria-label="Import JSON file"
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
              <p>
                Valid file: {pendingImport.applications.length} applications,{' '}
                {pendingImport.questions.length} questions.
              </p>
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
                  Replace all data
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImportExportMenu;
