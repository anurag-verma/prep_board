import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { DEFAULT_STAGES } from '../../types/models';
import QuickAddCard from './QuickAddCard';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
});

describe('QuickAddCard', () => {
  it('opens an inline form, saves on Enter, and card data lands in the store', () => {
    render(<QuickAddCard stageId="applied" />);

    fireEvent.click(screen.getByRole('button', { name: '+ card' }));

    const companyInput = screen.getByLabelText('Company');
    const roleInput = screen.getByLabelText('Role');
    fireEvent.change(companyInput, { target: { value: 'Acme Corp' } });
    fireEvent.change(roleInput, { target: { value: 'Frontend Engineer' } });
    fireEvent.keyDown(roleInput, { key: 'Enter' });

    const applications = useBoardStore.getState().applications;
    expect(applications).toHaveLength(1);
    expect(applications[0]).toMatchObject({
      company: 'Acme Corp',
      role: 'Frontend Engineer',
      stageId: 'applied',
    });
    expect(applications[0].events[0].type).toBe('created');

    // form closes and resets back to the "+ card" button
    expect(screen.getByRole('button', { name: '+ card' })).toBeInTheDocument();
  });

  it('Esc cancels without creating an application', () => {
    render(<QuickAddCard stageId="applied" />);

    fireEvent.click(screen.getByRole('button', { name: '+ card' }));
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Acme Corp' } });
    fireEvent.keyDown(screen.getByLabelText('Company'), { key: 'Escape' });

    expect(useBoardStore.getState().applications).toHaveLength(0);
    expect(screen.getByRole('button', { name: '+ card' })).toBeInTheDocument();
  });

  it('does not create an application when company is blank', () => {
    render(<QuickAddCard stageId="applied" />);

    fireEvent.click(screen.getByRole('button', { name: '+ card' }));
    fireEvent.keyDown(screen.getByLabelText('Company'), { key: 'Enter' });

    expect(useBoardStore.getState().applications).toHaveLength(0);
    // form stays open since nothing was saved
    expect(screen.getByLabelText('Company')).toBeInTheDocument();
  });
});
