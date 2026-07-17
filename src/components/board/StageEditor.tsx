import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { MAX_STAGES, MIN_STAGES, useBoardStore } from '../../store/useBoardStore';
import { useUiStore } from '../../store/useUiStore';
import type { Stage } from '../../types/models';
import Modal from '../ui/Modal';

function StageEditor() {
  const stages = useBoardStore((s) => s.stages);
  const applications = useBoardStore((s) => s.applications);
  const addStage = useBoardStore((s) => s.addStage);
  const updateStage = useBoardStore((s) => s.updateStage);
  const reorderStages = useBoardStore((s) => s.reorderStages);
  const deleteStage = useBoardStore((s) => s.deleteStage);
  const closeStageEditor = useUiStore((s) => s.closeStageEditor);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = stages.map((s) => s.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const reordered = [...ids];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, active.id as string);
    reorderStages(reordered);
  }

  function startDelete(stage: Stage) {
    const other = stages.find((s) => s.id !== stage.id);
    setDestinationId(other?.id ?? '');
    setDeletingId(stage.id);
  }

  function confirmDelete() {
    if (!deletingId || !destinationId) return;
    deleteStage(deletingId, destinationId);
    setDeletingId(null);
  }

  const canDelete = stages.length > MIN_STAGES;
  const canAdd = stages.length < MAX_STAGES;
  const deletingStage = stages.find((s) => s.id === deletingId);
  const deletingCount = deletingStage
    ? applications.filter((a) => a.stageId === deletingStage.id).length
    : 0;

  return (
    <Modal onClose={closeStageEditor} aria-label="Edit stages">
      <div className="flex items-center justify-between border-b border-line p-4">
        <h2 className="text-lg font-semibold">Edit stages</h2>
        <button
          type="button"
          aria-label="Close"
          title="Close"
          onClick={closeStageEditor}
          className="rounded p-1.5 text-muted hover:bg-bg hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto p-4">
        <p className="text-xs text-muted">
          Funnel conversion and stats follow this order — drag to reorder.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5">
              {stages.map((stage) => (
                <SortableStageRow
                  key={stage.id}
                  stage={stage}
                  canDelete={canDelete}
                  onUpdate={(patch) => updateStage(stage.id, patch)}
                  onDeleteClick={() => startDelete(stage)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={() => addStage()}
          disabled={!canAdd}
          className="mt-1 flex items-center justify-center gap-1 rounded-card border border-dashed border-line py-2 text-sm text-muted hover:border-action hover:text-action disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={14} /> Add stage
        </button>

        {deletingStage && (
          <div className="mt-2 flex flex-col gap-2 rounded-md border border-line p-3 text-sm">
            {deletingCount > 0 ? (
              <>
                <p>
                  {deletingCount} application{deletingCount === 1 ? '' : 's'} in{' '}
                  <strong>{deletingStage.name}</strong> will move to:
                </p>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  aria-label="Destination stage"
                  className="rounded border border-line bg-surface px-2 py-1.5"
                >
                  {stages
                    .filter((s) => s.id !== deletingStage.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </>
            ) : (
              <p>
                Delete <strong>{deletingStage.name}</strong>? It has no applications.
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-on-danger"
                style={{ backgroundColor: 'var(--danger)' }}
              >
                Delete stage
              </button>
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

interface SortableStageRowProps {
  stage: Stage;
  canDelete: boolean;
  onUpdate: (patch: Partial<Pick<Stage, 'name' | 'color' | 'isTerminal'>>) => void;
  onDeleteClick: () => void;
}

function SortableStageRow({ stage, canDelete, onUpdate, onDeleteClick }: SortableStageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: stage.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-line bg-surface p-2"
    >
      <button
        type="button"
        aria-label={`Reorder ${stage.name}`}
        title={`Reorder ${stage.name}`}
        className="cursor-grab text-muted hover:text-ink"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <input
        type="color"
        value={stage.color}
        onChange={(e) => onUpdate({ color: e.target.value })}
        aria-label={`${stage.name} color`}
        className="h-7 w-7 shrink-0 rounded border border-line"
      />
      <input
        value={stage.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        aria-label="Stage name"
        className="flex-1 rounded border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-action"
      />
      <label className="flex shrink-0 items-center gap-1 text-xs text-muted">
        <input
          type="checkbox"
          checked={stage.isTerminal}
          onChange={(e) => onUpdate({ isTerminal: e.target.checked })}
        />
        Terminal
      </label>
      <button
        type="button"
        onClick={onDeleteClick}
        disabled={!canDelete}
        aria-label={`Delete ${stage.name}`}
        title={`Delete ${stage.name}`}
        className="shrink-0 text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default StageEditor;
