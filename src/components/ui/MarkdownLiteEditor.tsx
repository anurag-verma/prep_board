import { Bold, Italic, List } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { applyBulletList, applyInlineWrap } from '../../lib/markdownLite';

interface MarkdownLiteEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  'aria-label'?: string;
  rows?: number;
}

function MarkdownLiteEditor({
  value,
  onChange,
  onBlur,
  'aria-label': ariaLabel,
  rows = 5,
}: MarkdownLiteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingSelection, setPendingSelection] = useState<{ start: number; end: number } | null>(
    null,
  );

  useEffect(() => {
    if (!pendingSelection || !textareaRef.current) return;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(pendingSelection.start, pendingSelection.end);
    setPendingSelection(null);
  }, [value, pendingSelection]);

  function withSelection(edit: (start: number, end: number) => ReturnType<typeof applyInlineWrap>) {
    const el = textareaRef.current;
    if (!el) return;
    const { newValue, newStart, newEnd } = edit(el.selectionStart, el.selectionEnd);
    onChange(newValue);
    setPendingSelection({ start: newStart, end: newEnd });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        <button
          type="button"
          aria-label="Bold"
          title="Bold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withSelection((s, e) => applyInlineWrap(value, s, e, '**'))}
          className="rounded p-1 text-muted hover:bg-bg hover:text-ink"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          aria-label="Italic"
          title="Italic"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withSelection((s, e) => applyInlineWrap(value, s, e, '*'))}
          className="rounded p-1 text-muted hover:bg-bg hover:text-ink"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          aria-label="Bullet list"
          title="Bullet list"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withSelection((s, e) => applyBulletList(value, s, e))}
          className="rounded p-1 text-muted hover:bg-bg hover:text-ink"
        >
          <List size={14} />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        rows={rows}
        aria-label={ariaLabel}
        className="resize-none rounded border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-action"
      />
    </div>
  );
}

export default MarkdownLiteEditor;
