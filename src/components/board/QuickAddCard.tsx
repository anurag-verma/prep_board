import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useBoardStore } from '../../store/useBoardStore';

interface QuickAddCardProps {
  stageId: string;
}

function QuickAddCard({ stageId }: QuickAddCardProps) {
  const addApplication = useBoardStore((s) => s.addApplication);
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const companyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) companyInputRef.current?.focus();
  }, [open]);

  function reset() {
    setCompany('');
    setRole('');
    setOpen(false);
  }

  function save() {
    if (!company.trim()) return;
    addApplication({ company: company.trim(), role: role.trim(), stageId });
    reset();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save();
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Two text fields and no submit button means the browser's implicit
    // form-submission-on-Enter doesn't fire, so submit explicitly here.
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      reset();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-card border border-dashed border-line px-3 py-2 text-left text-sm text-muted hover:border-action hover:text-action"
      >
        + card
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-1.5 rounded-card border border-line bg-surface p-2"
    >
      <input
        ref={companyInputRef}
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company"
        aria-label="Company"
        className="rounded border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-action"
      />
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Role"
        aria-label="Role"
        className="rounded border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-action"
      />
    </form>
  );
}

export default QuickAddCard;
