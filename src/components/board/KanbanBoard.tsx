import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { memo, useMemo, useState } from 'react';
import { computeMoveFromDragEnd, computeStagePosition, type DropTargetData } from '../../lib/dnd';
import { boardKeyboardCoordinateGetter } from '../../lib/dndKeyboard';
import { matchesFilters } from '../../lib/filters';
import { useBoardStore } from '../../store/useBoardStore';
import { useUiStore } from '../../store/useUiStore';
import type { Application } from '../../types/models';
import FilterBar from './FilterBar';
import JobCard from './JobCard';
import StageColumn from './StageColumn';

function KanbanBoard() {
  const stages = useBoardStore((s) => s.stages);
  const applications = useBoardStore((s) => s.applications);
  const moveCard = useBoardStore((s) => s.moveCard);
  const searchText = useUiStore((s) => s.searchText);
  const priorityOnly = useUiStore((s) => s.priorityOnly);
  const selectedTags = useUiStore((s) => s.selectedTags);
  const showArchived = useUiStore((s) => s.showArchived);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinateGetter }),
  );

  // Stable references across re-renders that don't actually change filter
  // results (e.g. opening the detail sheet) — lets the memoized StageColumn/
  // JobCard below skip re-rendering columns whose contents didn't change.
  const visibleApplications = useMemo(
    () =>
      applications.filter(
        (app) =>
          (showArchived || app.archivedAt === null) &&
          matchesFilters(app, { searchText, priorityOnly, selectedTags }),
      ),
    [applications, showArchived, searchText, priorityOnly, selectedTags],
  );
  const applicationsByStage = useMemo(() => {
    const map = new Map<string, Application[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const app of visibleApplications) map.get(app.stageId)?.push(app);
    return map;
  }, [stages, visibleApplications]);

  const activeApp = activeId ? visibleApplications.find((a) => a.id === activeId) : undefined;
  const activeStage = activeApp ? stages.find((s) => s.id === activeApp.stageId) : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const overData = over.data.current as DropTargetData | undefined;
    const move = computeMoveFromDragEnd(over.id as string, overData);
    if (!move) return;

    moveCard(active.id as string, move.toStageId, move.beforeId);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      const app = visibleApplications.find((a) => a.id === active.id);
      return `Picked up ${app?.company ?? 'card'}.`;
    },
    onDragOver({ active, over }) {
      if (!over) return undefined;
      const app = visibleApplications.find((a) => a.id === active.id);
      const overData = over.data.current as DropTargetData | undefined;
      const stage = stages.find((s) => s.id === overData?.stageId);
      return `${app?.company ?? 'Card'} is over ${stage?.name ?? 'a column'}.`;
    },
    onDragEnd({ active, over }) {
      const app = visibleApplications.find((a) => a.id === active.id);
      if (!over) return `${app?.company ?? 'Card'} move cancelled.`;

      const overData = over.data.current as DropTargetData | undefined;
      const move = computeMoveFromDragEnd(over.id as string, overData);
      if (!move) return `${app?.company ?? 'Card'} move cancelled.`;

      const stage = stages.find((s) => s.id === move.toStageId);
      const { position, total } = computeStagePosition(
        visibleApplications,
        active.id as string,
        move.toStageId,
        move.beforeId,
      );
      return `${app?.company ?? 'Card'} moved to ${stage?.name ?? move.toStageId}, position ${position} of ${total}.`;
    },
    onDragCancel({ active }) {
      const app = visibleApplications.find((a) => a.id === active.id);
      return `Movement of ${app?.company ?? 'card'} cancelled.`;
    },
  };

  return (
    <>
      <FilterBar />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        accessibility={{ announcements }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-3 overflow-x-auto p-4">
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              applications={applicationsByStage.get(stage.id) ?? []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeApp && activeStage && (
            <div className="rotate-2 [box-shadow:var(--shadow-popover)]">
              <JobCard application={activeApp} stage={activeStage} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}

export default memo(KanbanBoard);
