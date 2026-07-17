import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __flushStorageForTests,
  __resetStorageCacheForTests,
  clearAllData,
  didRecoverFromCorruptData,
  sharedStorage,
} from './persistStorage';

const STORAGE_KEY = 'prepboard-data';

beforeEach(() => {
  localStorage.clear();
  __resetStorageCacheForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('sharedStorage', () => {
  it('keeps multiple slices under one localStorage key, debounced', () => {
    vi.useFakeTimers();

    sharedStorage.setItem('board', JSON.stringify({ hello: 'board' }));
    sharedStorage.setItem('questions', JSON.stringify({ hello: 'questions' }));

    // not flushed yet
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    vi.advanceTimersByTime(500);

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.board).toEqual({ hello: 'board' });
    expect(parsed.questions).toEqual({ hello: 'questions' });
  });

  it('reads back a value written under its own name', () => {
    sharedStorage.setItem('board', JSON.stringify({ a: 1 }));
    __flushStorageForTests();
    __resetStorageCacheForTests();

    expect(sharedStorage.getItem('board')).toBe(JSON.stringify({ a: 1 }));
  });

  it('returns null for a name that was never written', () => {
    expect(sharedStorage.getItem('nothing-here')).toBeNull();
  });

  it('removeItem drops only its own slice', () => {
    sharedStorage.setItem('board', JSON.stringify({ a: 1 }));
    sharedStorage.setItem('questions', JSON.stringify({ b: 2 }));
    __flushStorageForTests();

    sharedStorage.removeItem('board');
    __flushStorageForTests();
    __resetStorageCacheForTests();

    expect(sharedStorage.getItem('board')).toBeNull();
    expect(sharedStorage.getItem('questions')).toBe(JSON.stringify({ b: 2 }));
  });

  it('recovers from corrupt JSON without throwing, backs up the raw string', () => {
    localStorage.setItem(STORAGE_KEY, '{ this is not valid json');

    expect(() => sharedStorage.getItem('board')).not.toThrow();
    expect(sharedStorage.getItem('board')).toBeNull();
    expect(didRecoverFromCorruptData()).toBe(true);

    const backupKey = Object.keys(localStorage).find((k) =>
      k.startsWith(`${STORAGE_KEY}-corrupt-`),
    );
    expect(backupKey).toBeDefined();
    expect(localStorage.getItem(backupKey!)).toBe('{ this is not valid json');
    // the corrupt primary key itself is cleared so we don't re-trip on it
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('clearAllData', () => {
  it('removes the localStorage key entirely', () => {
    sharedStorage.setItem('board', JSON.stringify({ a: 1 }));
    __flushStorageForTests();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    clearAllData();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('clears the in-memory cache so a pending debounced write cannot undo the clear', () => {
    vi.useFakeTimers();
    sharedStorage.setItem('board', JSON.stringify({ a: 1 })); // schedules a flush, not yet fired

    clearAllData();
    vi.advanceTimersByTime(1000); // let any stale timer fire, if it still exists

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('leaves a clean slate that reads back as empty', () => {
    sharedStorage.setItem('board', JSON.stringify({ a: 1 }));
    __flushStorageForTests();

    clearAllData();

    expect(sharedStorage.getItem('board')).toBeNull();
  });
});
