import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_STAGES } from '../types/models';
import { __flushStorageForTests, __resetStorageCacheForTests } from './persistStorage';
import { useBoardStore } from './useBoardStore';
import { useQuestionStore } from './useQuestionStore';
import { useUiStore } from './useUiStore';

beforeEach(() => {
  localStorage.clear();
  __resetStorageCacheForTests();
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
  useQuestionStore.setState({ questions: [] });
  useUiStore.setState({ collapsedStageIds: ['rejected'], celebration: 0 });
});

describe('useBoardStore', () => {
  it('addApplication creates a card in the first stage with a created event', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });

    expect(app.stageId).toBe(DEFAULT_STAGES[0].id);
    expect(app.events).toHaveLength(1);
    expect(app.events[0].type).toBe('created');
    expect(useBoardStore.getState().applications).toHaveLength(1);
  });

  it('moveCard atomically updates stageId and appends a stage_change event', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });

    useBoardStore.getState().moveCard(app.id, 'interviewing');

    const updated = useBoardStore.getState().applications.find((a) => a.id === app.id)!;
    expect(updated.stageId).toBe('interviewing');
    expect(updated.events).toHaveLength(2);

    const moveEvent = updated.events[1];
    expect(moveEvent.type).toBe('stage_change');
    expect(moveEvent.fromStageId).toBe(DEFAULT_STAGES[0].id);
    expect(moveEvent.toStageId).toBe('interviewing');
    expect(moveEvent.label).toBe('Moved to Interviewing');
  });

  it('moveCard is a no-op when moving to the same stage', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });

    useBoardStore.getState().moveCard(app.id, app.stageId);

    const unchanged = useBoardStore.getState().applications.find((a) => a.id === app.id)!;
    expect(unchanged.events).toHaveLength(1);
  });

  it('moveCard into the Offer stage triggers a celebration', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });
    expect(useUiStore.getState().celebration).toBe(0);

    useBoardStore.getState().moveCard(app.id, 'offer');

    expect(useUiStore.getState().celebration).toBe(1);
  });

  it('moveCard into a non-Offer stage does not trigger a celebration', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });

    useBoardStore.getState().moveCard(app.id, 'interviewing');

    expect(useUiStore.getState().celebration).toBe(0);
  });

  it('moving OUT of the Offer stage does not trigger a celebration', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });
    useBoardStore.getState().moveCard(app.id, 'offer');
    expect(useUiStore.getState().celebration).toBe(1);

    useBoardStore.getState().moveCard(app.id, 'rejected');

    expect(useUiStore.getState().celebration).toBe(1);
  });

  it('moveCard with a beforeId reorders within the same stage without an event', () => {
    const a = useBoardStore.getState().addApplication({ company: 'A', role: 'Eng' });
    useBoardStore.getState().addApplication({ company: 'B', role: 'Eng' });
    const c = useBoardStore.getState().addApplication({ company: 'C', role: 'Eng' });

    // move C before A: expect order C, A, B
    useBoardStore.getState().moveCard(c.id, a.stageId, a.id);

    const order = useBoardStore.getState().applications.map((app) => app.company);
    expect(order).toEqual(['C', 'A', 'B']);
    // purely a reorder: no stage_change event appended
    const updatedC = useBoardStore.getState().applications.find((app) => app.id === c.id)!;
    expect(updatedC.events).toHaveLength(1);
  });

  it('moveCard across stages with a beforeId inserts at that position and logs the event', () => {
    useBoardStore.getState().addApplication({ company: 'A', role: 'Eng', stageId: 'interviewing' });
    const b = useBoardStore.getState().addApplication({ company: 'B', role: 'Eng', stageId: 'interviewing' });
    const c = useBoardStore.getState().addApplication({ company: 'C', role: 'Eng' }); // wishlist

    useBoardStore.getState().moveCard(c.id, 'interviewing', b.id);

    const order = useBoardStore
      .getState()
      .applications.filter((app) => app.stageId === 'interviewing')
      .map((app) => app.company);
    expect(order).toEqual(['A', 'C', 'B']);

    const updatedC = useBoardStore.getState().applications.find((app) => app.id === c.id)!;
    expect(updatedC.stageId).toBe('interviewing');
    expect(updatedC.events).toHaveLength(2);
    expect(updatedC.events[1].type).toBe('stage_change');
  });

  it('addRound pushes a round and logs a round_added event', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });

    useBoardStore.getState().addRound(app.id, {
      type: 'technical',
      date: '2026-07-16',
      outcome: 'pending',
      prepNotes: '',
      reflectionNotes: '',
      questionIds: [],
    });

    const updated = useBoardStore.getState().applications.find((a) => a.id === app.id)!;
    expect(updated.rounds).toHaveLength(1);
    expect(updated.events).toHaveLength(2);
    expect(updated.events[1].type).toBe('round_added');
  });

  it('updateRound merges a patch into the matching round only', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });
    const round = useBoardStore.getState().addRound(app.id, {
      type: 'technical',
      date: '2026-07-16',
      outcome: 'pending',
      prepNotes: '',
      reflectionNotes: '',
      questionIds: [],
    });

    useBoardStore.getState().updateRound(app.id, round.id, { outcome: 'passed' });

    const updated = useBoardStore
      .getState()
      .applications.find((a) => a.id === app.id)!
      .rounds.find((r) => r.id === round.id)!;
    expect(updated.outcome).toBe('passed');
  });

  it('deleteRound removes only the targeted round', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });
    const round1 = useBoardStore.getState().addRound(app.id, {
      type: 'phone_screen',
      date: '2026-07-01',
      outcome: 'passed',
      prepNotes: '',
      reflectionNotes: '',
      questionIds: [],
    });
    const round2 = useBoardStore.getState().addRound(app.id, {
      type: 'technical',
      date: '2026-07-10',
      outcome: 'pending',
      prepNotes: '',
      reflectionNotes: '',
      questionIds: [],
    });

    useBoardStore.getState().deleteRound(app.id, round1.id);

    const rounds = useBoardStore.getState().applications.find((a) => a.id === app.id)!.rounds;
    expect(rounds).toHaveLength(1);
    expect(rounds[0].id).toBe(round2.id);
  });

  it('archiveApplication sets archivedAt; unarchive clears it', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });

    useBoardStore.getState().archiveApplication(app.id);
    expect(
      useBoardStore.getState().applications.find((a) => a.id === app.id)!.archivedAt,
    ).not.toBeNull();

    useBoardStore.getState().unarchiveApplication(app.id);
    expect(
      useBoardStore.getState().applications.find((a) => a.id === app.id)!.archivedAt,
    ).toBeNull();
  });

  it('deleteApplication removes the card and strips its id from question companyIds', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });
    const question = useQuestionStore.getState().addQuestion({
      text: 'Reverse a linked list',
      category: 'dsa',
      difficulty: 'medium',
      companyIds: [app.id],
    });

    useBoardStore.getState().deleteApplication(app.id);

    expect(useBoardStore.getState().applications).toHaveLength(0);
    const updatedQuestion = useQuestionStore.getState().questions.find((q) => q.id === question.id)!;
    expect(updatedQuestion.companyIds).not.toContain(app.id);
  });

  it('addStage appends a new stage with defaults, and refuses past MAX_STAGES', () => {
    const stage = useBoardStore.getState().addStage({ name: 'Custom Stage' });
    expect(stage).not.toBeNull();
    expect(useBoardStore.getState().stages).toHaveLength(7);
    expect(useBoardStore.getState().stages.at(-1)!.name).toBe('Custom Stage');

    // fill up to MAX_STAGES (8): currently at 7, add 1 more to hit 8
    useBoardStore.getState().addStage({ name: 'Eighth' });
    expect(useBoardStore.getState().stages).toHaveLength(8);

    const rejected = useBoardStore.getState().addStage({ name: 'Ninth' });
    expect(rejected).toBeNull();
    expect(useBoardStore.getState().stages).toHaveLength(8);
  });

  it('updateStage patches name/color/isTerminal for the matching stage only', () => {
    useBoardStore.getState().updateStage('applied', { name: 'In Progress', color: '#000000' });

    const stages = useBoardStore.getState().stages;
    expect(stages.find((s) => s.id === 'applied')!.name).toBe('In Progress');
    expect(stages.find((s) => s.id === 'applied')!.color).toBe('#000000');
    expect(stages.find((s) => s.id === 'wishlist')!.name).toBe('Wishlist');
  });

  it('reorderStages reorders stages to match the given id order', () => {
    useBoardStore.getState().reorderStages(['offer', 'wishlist', 'applied', 'oa', 'interviewing', 'rejected']);

    expect(useBoardStore.getState().stages.map((s) => s.id)).toEqual([
      'offer',
      'wishlist',
      'applied',
      'oa',
      'interviewing',
      'rejected',
    ]);
  });

  it('deleteStage relocates cards to the destination and logs a stage_change event', () => {
    const app = useBoardStore
      .getState()
      .addApplication({ company: 'Acme', role: 'Eng', stageId: 'oa' });

    useBoardStore.getState().deleteStage('oa', 'applied');

    expect(useBoardStore.getState().stages.some((s) => s.id === 'oa')).toBe(false);
    const updated = useBoardStore.getState().applications.find((a) => a.id === app.id)!;
    expect(updated.stageId).toBe('applied');
    expect(updated.events.some((e) => e.type === 'stage_change' && e.fromStageId === 'oa')).toBe(
      true,
    );
  });

  it('deleteStage also removes the stage id from collapsedStageIds', () => {
    useUiStore.setState({ collapsedStageIds: ['rejected', 'oa'] });
    useBoardStore.getState().deleteStage('oa', 'applied');
    expect(useUiStore.getState().collapsedStageIds).toEqual(['rejected']);
  });

  it('deleteStage refuses to drop below MIN_STAGES', () => {
    useBoardStore.setState({
      stages: [DEFAULT_STAGES[0], DEFAULT_STAGES[1]],
    });
    useBoardStore.getState().deleteStage(DEFAULT_STAGES[0].id, DEFAULT_STAGES[1].id);
    expect(useBoardStore.getState().stages).toHaveLength(2);
  });

  it('deleteStage no-ops if the destination stage does not exist', () => {
    useBoardStore.getState().deleteStage('oa', 'no-such-stage');
    expect(useBoardStore.getState().stages.some((s) => s.id === 'oa')).toBe(true);
  });

  it('survives a simulated page refresh (rehydrates from localStorage)', async () => {
    const app = useBoardStore.getState().addApplication({ company: 'Persisted Co', role: 'SRE' });
    __flushStorageForTests();

    // Simulate a refresh: reset the whole module graph (incl. the storage's in-memory
    // cache) so the reloaded store must actually read back from localStorage.
    vi.resetModules();
    const { useBoardStore: reloadedStore } = await import('./useBoardStore');
    await reloadedStore.persist.rehydrate();

    const reloadedApp = reloadedStore.getState().applications.find((a) => a.id === app.id);
    expect(reloadedApp).toBeDefined();
    expect(reloadedApp?.company).toBe('Persisted Co');
  });
});
