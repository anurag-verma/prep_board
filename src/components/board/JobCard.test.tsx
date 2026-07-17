import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeApplication, makeStage, makeTimelineEvent } from '../../test/fixtures';
import JobCard from './JobCard';

describe('JobCard', () => {
  it('renders company, role, and hides optional fields when absent', () => {
    const stage = makeStage({ isTerminal: false });
    const app = makeApplication({ company: 'Acme Corp', role: 'Frontend Engineer' });

    render(<JobCard application={app} stage={stage} />);

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.queryByText('Remote')).not.toBeInTheDocument();
    expect(screen.queryByText(/round/)).not.toBeInTheDocument();
    expect(screen.queryByText('Priority', { selector: 'span' })).not.toBeInTheDocument();
  });

  it('renders remote and salary badges when present', () => {
    const stage = makeStage({ isTerminal: false });
    const app = makeApplication({ remote: 'remote', salaryRange: '₹18–24L' });

    render(<JobCard application={app} stage={stage} />);

    expect(screen.getByText('Remote')).toBeInTheDocument();
    expect(screen.getByText('₹18–24L')).toBeInTheDocument();
  });

  it('shows the priority flag with an accessible label when priority is true', () => {
    const stage = makeStage({ isTerminal: false });
    const app = makeApplication({ priority: true });

    render(<JobCard application={app} stage={stage} />);

    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('shows a pluralized rounds count', () => {
    const stage = makeStage({ isTerminal: false });
    const app = makeApplication({
      rounds: [
        { id: 'r1', type: 'technical', date: '2026-07-01', outcome: 'pending', prepNotes: '', reflectionNotes: '', questionIds: [] },
        { id: 'r2', type: 'hr', date: '2026-07-02', outcome: 'pending', prepNotes: '', reflectionNotes: '', questionIds: [] },
      ],
    });

    render(<JobCard application={app} stage={stage} />);

    expect(screen.getByText(/2 rounds/)).toBeInTheDocument();
  });

  it('marks a card stale (amber) once >=14 days in a non-terminal stage', () => {
    const stage = makeStage({ isTerminal: false });
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const app = makeApplication({
      events: [makeTimelineEvent({ type: 'created', at: fourteenDaysAgo.toISOString() })],
    });

    render(<JobCard application={app} stage={stage} />);

    expect(screen.getByText('Stale — consider following up')).toBeInTheDocument();
  });

  it('never marks a card in a terminal stage as stale, however old', () => {
    const stage = makeStage({ isTerminal: true });
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const app = makeApplication({
      events: [makeTimelineEvent({ type: 'created', at: sixtyDaysAgo.toISOString() })],
    });

    render(<JobCard application={app} stage={stage} />);

    expect(screen.queryByText('Stale — consider following up')).not.toBeInTheDocument();
  });
});
