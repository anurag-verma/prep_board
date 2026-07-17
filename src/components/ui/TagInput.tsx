import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  'aria-label'?: string;
}

function TagInput({ tags, onChange, 'aria-label': ariaLabel = 'Tags' }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function addTag() {
    const value = draft.trim();
    setDraft('');
    if (!value || tags.includes(value)) return;
    onChange([...tags, value]);
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded border border-line bg-surface px-2 py-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-xs text-ink"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Remove tag ${tag}`}
            title="Remove tag"
            className="text-muted hover:text-ink"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? 'Add a tag…' : ''}
        aria-label={ariaLabel}
        className="min-w-[6rem] flex-1 border-none bg-transparent text-sm outline-none"
      />
    </div>
  );
}

export default TagInput;
