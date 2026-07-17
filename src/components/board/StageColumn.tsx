import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { memo } from 'react';
import type { Application, Stage } from '../../types/models';
import { useUiStore } from '../../store/useUiStore';
import QuickAddCard from './QuickAddCard';
import SortableJobCard from './SortableJobCard';

interface StageColumnProps {
  stage: Stage;
  applications: Application[];
}

function StageColumn({ stage, applications }: StageColumnProps) {
  const collapsed = useUiStore((s) => s.collapsedStageIds.includes(stage.id));
  const toggleCollapsed = useUiStore((s) => s.toggleStageCollapsed);
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: stage.id,
    data: { type: 'column', stageId: stage.id },
  });

  if (collapsed) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center rounded-column border border-line bg-surface py-3">
        <button
          type="button"
          onClick={() => toggleCollapsed(stage.id)}
          aria-expanded={false}
          aria-label={`${applications.length} ${stage.name}, expand column`}
          title={`Expand ${stage.name} column`}
          className="flex flex-col items-center gap-2"
        >
          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="font-mono text-xs text-muted">{applications.length}</span>{' '}
          <span className="[writing-mode:vertical-rl] text-sm font-medium text-muted">
            {stage.name}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-column border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
        <h2 className="text-sm font-semibold">{stage.name}</h2>
        <span className="font-mono text-xs text-muted">({applications.length})</span>
        <button
          type="button"
          onClick={() => toggleCollapsed(stage.id)}
          aria-expanded={true}
          aria-label={`Collapse ${stage.name} column`}
          title={`Collapse ${stage.name} column`}
          className="ml-auto rounded px-1 text-muted hover:bg-bg hover:text-ink"
        >
          ⋯
        </button>
      </div>

      <div
        ref={setDroppableRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-2"
        style={{ maxHeight: '70vh' }}
      >
        <SortableContext
          items={applications.map((app) => app.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((app) => (
            <SortableJobCard key={app.id} application={app} stage={stage} />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <p className="px-1 py-2 text-xs text-muted">No applications yet.</p>
        )}
        <QuickAddCard stageId={stage.id} />
      </div>
    </div>
  );
}

export default memo(StageColumn);
