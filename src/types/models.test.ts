import { describe, expect, it } from 'vitest';
import {
  makeAppData,
  makeApplication,
  makeContact,
  makeQuestion,
  makeRound,
  makeStage,
  makeTimelineEvent,
} from '../test/fixtures';
import { DEFAULT_STAGES } from './models';

describe('DEFAULT_STAGES', () => {
  it('has 6 stages with Offer and Rejected marked terminal', () => {
    expect(DEFAULT_STAGES).toHaveLength(6);
    const terminal = DEFAULT_STAGES.filter((s) => s.isTerminal).map((s) => s.id);
    expect(terminal.sort()).toEqual(['offer', 'rejected']);
  });

  it('has unique ids', () => {
    const ids = DEFAULT_STAGES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('fixtures', () => {
  it('build valid objects with overrides applied', () => {
    const stage = makeStage({ name: 'Custom' });
    expect(stage.name).toBe('Custom');

    const contact = makeContact();
    expect(contact.id).toBeTruthy();

    const event = makeTimelineEvent({ type: 'stage_change' });
    expect(event.type).toBe('stage_change');

    const round = makeRound({ outcome: 'passed' });
    expect(round.outcome).toBe('passed');

    const question = makeQuestion({ confidence: 5 });
    expect(question.confidence).toBe(5);

    const application = makeApplication({ company: 'Globex', rounds: [round] });
    expect(application.company).toBe('Globex');
    expect(application.rounds).toHaveLength(1);

    const appData = makeAppData({ applications: [application] });
    expect(appData.applications).toHaveLength(1);
    expect(appData.schemaVersion).toBe(1);
  });

  it('generates distinct ids across calls', () => {
    const a = makeApplication();
    const b = makeApplication();
    expect(a.id).not.toBe(b.id);
  });
});
