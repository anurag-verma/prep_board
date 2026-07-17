import { Flag, MoreVertical, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useUiStore } from '../../store/useUiStore';
import type { Application, Stage } from '../../types/models';
import Sheet from '../ui/Sheet';
import { usePopoverBehavior } from '../ui/usePopoverBehavior';
import ApplicationForm from './ApplicationForm';
import RoundsTab from './RoundsTab';
import TimelineTab from './TimelineTab';

type Tab = 'details' | 'rounds' | 'timeline';

interface DetailSheetProps {
  application: Application;
  stages: Stage[];
}

function DetailSheet({ application, stages }: DetailSheetProps) {
  const moveCard = useBoardStore((s) => s.moveCard);
  const updateApplication = useBoardStore((s) => s.updateApplication);
  const archiveApplication = useBoardStore((s) => s.archiveApplication);
  const unarchiveApplication = useBoardStore((s) => s.unarchiveApplication);
  const deleteApplication = useBoardStore((s) => s.deleteApplication);
  const closeDetail = useUiStore((s) => s.closeDetail);

  const [tab, setTab] = useState<Tab>('details');
  const [menuOpen, setMenuOpen] = useState(false);
  const [company, setCompany] = useState(application.company);
  const [role, setRole] = useState(application.role);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuRef = usePopoverBehavior<HTMLDivElement>(menuOpen, closeMenu, {
    closeOnEscape: false, // the parent Sheet already owns Escape
  });

  function commitCompany() {
    const trimmed = company.trim();
    if (trimmed && trimmed !== application.company) {
      updateApplication(application.id, { company: trimmed });
    } else {
      setCompany(application.company);
    }
  }

  function commitRole() {
    const trimmed = role.trim();
    if (trimmed !== application.role) {
      updateApplication(application.id, { role: trimmed });
    }
  }

  function handleArchive() {
    setMenuOpen(false);
    archiveApplication(application.id);
    closeDetail();
  }

  function handleUnarchive() {
    setMenuOpen(false);
    unarchiveApplication(application.id);
  }

  function handleDelete() {
    setMenuOpen(false);
    if (window.confirm(`Delete ${application.company}? This cannot be undone.`)) {
      deleteApplication(application.id);
      closeDetail();
    }
  }

  return (
    <Sheet onClose={closeDetail} aria-label={`${application.company} details`}>
      <div className="flex items-start gap-2 border-b border-line p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {application.archivedAt !== null && (
            <span className="w-fit rounded-full bg-bg px-2 py-0.5 text-xs text-muted">
              Archived
            </span>
          )}
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onBlur={commitCompany}
            aria-label="Company"
            className="w-full rounded bg-transparent px-1 py-0.5 text-lg font-semibold outline-none focus:bg-bg"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onBlur={commitRole}
            aria-label="Role"
            className="w-full rounded bg-transparent px-1 py-0.5 text-sm text-muted outline-none focus:bg-bg"
          />
          <select
            value={application.stageId}
            onChange={(e) => moveCard(application.id, e.target.value)}
            aria-label="Stage"
            className="mt-1 w-fit rounded border border-line bg-surface px-2 py-1 text-sm"
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          aria-pressed={application.priority}
          aria-label={application.priority ? 'Unmark priority' : 'Mark as priority'}
          title={application.priority ? 'Unmark priority' : 'Mark as priority'}
          onClick={() => updateApplication(application.id, { priority: !application.priority })}
          className="rounded p-1.5 text-muted hover:bg-bg hover:text-ink"
        >
          <Flag
            size={18}
            style={{ color: application.priority ? 'var(--flag)' : undefined }}
            fill={application.priority ? 'var(--flag)' : 'none'}
          />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="More actions"
            title="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded p-1.5 text-muted hover:bg-bg hover:text-ink"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-10 mt-1 w-36 rounded-md border border-line bg-surface py-1 [box-shadow:var(--shadow-popover)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={application.archivedAt === null ? handleArchive : handleUnarchive}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-bg"
              >
                {application.archivedAt === null ? 'Archive' : 'Unarchive'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleDelete}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-bg"
                style={{ color: 'var(--danger)' }}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Close"
          title="Close"
          onClick={closeDetail}
          className="rounded p-1.5 text-muted hover:bg-bg hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      <div role="tablist" className="flex gap-1 border-b border-line px-4 pt-2">
        {(['details', 'rounds', 'timeline'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-t px-3 py-1.5 text-sm font-medium capitalize ${
              tab === t ? 'border-b-2 border-action text-action' : 'text-muted hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4" role="tabpanel">
        {tab === 'details' && <ApplicationForm application={application} />}
        {tab === 'rounds' && <RoundsTab application={application} />}
        {tab === 'timeline' && <TimelineTab application={application} />}
      </div>
    </Sheet>
  );
}

export default DetailSheet;
