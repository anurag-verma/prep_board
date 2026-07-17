import {
  closestCorners,
  getFirstCollision,
  KeyboardCode,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';

const DIRECTION_KEYS: string[] = [
  KeyboardCode.Down,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Left,
];

/**
 * dnd-kit's default `sortableKeyboardCoordinates` only reliably reorders
 * within a single list — it has no notion of "the next column over." This
 * extends it so Left/Right can cross between stage columns (each of which is
 * both a droppable and a SortableContext), while Up/Down still reorder
 * within the current column. Same approach as dnd-kit's own multi-container
 * sortable example.
 */
export const boardKeyboardCoordinateGetter: KeyboardCoordinateGetter = (
  event,
  { context: { active, collisionRect, droppableRects, droppableContainers } },
) => {
  if (!DIRECTION_KEYS.includes(event.code)) return undefined;
  event.preventDefault();
  if (!active || !collisionRect) return undefined;

  const candidates = droppableContainers.getEnabled().filter((entry) => {
    const rect = droppableRects.get(entry.id);
    if (!rect) return false;

    switch (event.code) {
      case KeyboardCode.Down:
        return collisionRect.top < rect.top;
      case KeyboardCode.Up:
        return collisionRect.top > rect.top;
      case KeyboardCode.Left:
        return collisionRect.left >= rect.left + rect.width;
      case KeyboardCode.Right:
        return collisionRect.left + collisionRect.width <= rect.left;
      default:
        return false;
    }
  });

  const collisions = closestCorners({
    active,
    collisionRect,
    droppableRects,
    droppableContainers: candidates,
    pointerCoordinates: null,
  });
  const closestId = getFirstCollision(collisions, 'id');
  if (closestId == null) return undefined;

  const newRect = droppableRects.get(closestId);
  if (!newRect) return undefined;

  return { x: newRect.left, y: newRect.top };
};
