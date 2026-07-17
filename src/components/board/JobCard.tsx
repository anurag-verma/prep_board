import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { Building, Building2, Clock, Flag, Globe } from 'lucide-react';
import { memo, type CSSProperties } from 'react';
import { getDaysInStage, STALE_DAYS_IN_STAGE } from '../../lib/applications';
import { useUiStore } from '../../store/useUiStore';
import type { Application, Stage } from '../../types/models';

const REMOTE_LABEL: Record<NonNullable<Application['remote']>, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'Onsite',
};

const REMOTE_ICON = {
  remote: Globe,
  hybrid: Building2,
  onsite: Building,
};

export interface JobCardDragHandle {
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  style?: CSSProperties;
  isDragging?: boolean;
}

interface JobCardProps {
  application: Application;
  stage: Stage;
  dragHandle?: JobCardDragHandle;
}

function JobCard({ application, stage, dragHandle }: JobCardProps) {
  const openDetail = useUiStore((s) => s.openDetail);

  const daysInStage = getDaysInStage(application);
  const isStale = !stage.isTerminal && daysInStage >= STALE_DAYS_IN_STAGE;
  const RemoteIcon = application.remote ? REMOTE_ICON[application.remote] : null;
  const hasBadgeRow = application.remote || application.salaryRange;
  const roundsCount = application.rounds.length;

  return (
    <button
      ref={dragHandle?.setNodeRef}
      type="button"
      onClick={() => openDetail(application.id)}
      style={dragHandle?.style}
      className={`w-full rounded-card border border-line bg-surface p-3 text-left text-sm [box-shadow:var(--shadow-resting)] transition-shadow hover:[box-shadow:var(--shadow-elevated)] ${
        dragHandle?.isDragging ? 'opacity-50' : ''
      } ${application.archivedAt !== null ? 'opacity-60' : ''}`}
      {...dragHandle?.attributes}
      {...dragHandle?.listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold">
          {application.company}
          {application.archivedAt !== null && (
            <span className="rounded-full bg-bg px-1.5 py-0.5 text-xs font-normal text-muted">
              Archived
            </span>
          )}
        </span>
        {application.priority && (
          <span title="Priority">
            <Flag aria-hidden size={14} style={{ color: 'var(--flag)' }} />
            <span className="sr-only">Priority</span>
          </span>
        )}
      </div>

      <div className="text-muted">{application.role}</div>

      {hasBadgeRow && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-muted">
          {application.remote && RemoteIcon && (
            <span className="flex items-center gap-1">
              <RemoteIcon aria-hidden size={12} />
              {REMOTE_LABEL[application.remote]}
            </span>
          )}
          {application.remote && application.salaryRange && <span aria-hidden>·</span>}
          {application.salaryRange && <span>{application.salaryRange}</span>}
        </div>
      )}

      <div
        className="mt-1.5 flex items-center gap-1 font-mono text-xs"
        style={{ color: isStale ? 'var(--flag-text)' : 'var(--muted)' }}
      >
        <Clock aria-hidden size={12} />
        <span>{daysInStage}d in stage</span>
        {roundsCount > 0 && (
          <span>
            · {roundsCount} round{roundsCount === 1 ? '' : 's'}
          </span>
        )}
        {isStale && (
          <span
            aria-hidden
            title="Stale — consider following up"
            className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: 'var(--flag)' }}
          />
        )}
        {isStale && <span className="sr-only">Stale — consider following up</span>}
      </div>
    </button>
  );
}

export default memo(JobCard);
