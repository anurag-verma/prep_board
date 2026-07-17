export interface DropTargetData {
  type: 'column' | 'card';
  stageId: string;
}

export interface ComputedMove {
  toStageId: string;
  beforeId?: string;
}

/** Turns a dnd-kit drag-end (active item id + the `over` target's data) into
 * a concrete move: which stage, and which existing card (if any) it should
 * land in front of. Returns null when there's nothing to act on. */
export function computeMoveFromDragEnd(
  overId: string,
  overData: DropTargetData | undefined,
): ComputedMove | null {
  if (!overData) return null;
  if (overData.type === 'column') {
    return { toStageId: overData.stageId };
  }
  return { toStageId: overData.stageId, beforeId: overId };
}

/** 1-based position a card would land at within its destination stage, for
 * the aria-live "moved to X, position N of M" announcement. */
export function computeStagePosition(
  applications: { id: string; stageId: string }[],
  activeId: string,
  toStageId: string,
  beforeId?: string,
): { position: number; total: number } {
  const stageApps = applications.filter((a) => a.stageId === toStageId && a.id !== activeId);
  const total = stageApps.length + 1;

  if (beforeId) {
    const idx = stageApps.findIndex((a) => a.id === beforeId);
    if (idx !== -1) return { position: idx + 1, total };
  }
  return { position: total, total };
}
