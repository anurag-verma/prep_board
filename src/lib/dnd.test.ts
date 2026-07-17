import { describe, expect, it } from 'vitest';
import { computeMoveFromDragEnd, computeStagePosition } from './dnd';

describe('computeMoveFromDragEnd', () => {
  it('returns null when there is no over data (dropped outside any target)', () => {
    expect(computeMoveFromDragEnd('card-1', undefined)).toBeNull();
  });

  it('targets the end of the stage when dropped on an empty column', () => {
    const result = computeMoveFromDragEnd('col-applied', { type: 'column', stageId: 'applied' });
    expect(result).toEqual({ toStageId: 'applied' });
  });

  it('targets the position before the hovered card when dropped on a card', () => {
    const result = computeMoveFromDragEnd('card-2', { type: 'card', stageId: 'applied' });
    expect(result).toEqual({ toStageId: 'applied', beforeId: 'card-2' });
  });
});

describe('computeStagePosition', () => {
  const applications = [
    { id: 'a', stageId: 'applied' },
    { id: 'b', stageId: 'applied' },
    { id: 'c', stageId: 'oa' },
  ];

  it('is position = total when appended to the end (no beforeId)', () => {
    expect(computeStagePosition(applications, 'c', 'applied')).toEqual({ position: 3, total: 3 });
  });

  it('is 1-based position of the beforeId target within the destination stage', () => {
    expect(computeStagePosition(applications, 'c', 'applied', 'b')).toEqual({
      position: 2,
      total: 3,
    });
  });

  it('excludes the active card itself from the destination stage count', () => {
    // moving 'a' within its own stage, before 'b'
    expect(computeStagePosition(applications, 'a', 'applied', 'b')).toEqual({
      position: 1,
      total: 2,
    });
  });

  it('falls back to appending at the end if beforeId is not found in that stage', () => {
    expect(computeStagePosition(applications, 'c', 'applied', 'nonexistent')).toEqual({
      position: 3,
      total: 3,
    });
  });
});
