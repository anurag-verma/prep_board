import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { DEFAULT_STAGES } from '../../types/models';
import ApplicationForm from './ApplicationForm';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
});

function seedApplication() {
  return useBoardStore.getState().addApplication({ company: 'Acme Corp', role: 'Engineer' });
}

function currentApp(id: string) {
  return useBoardStore.getState().applications.find((a) => a.id === id)!;
}

describe('ApplicationForm', () => {
  it('persists the location field on blur', () => {
    const app = seedApplication();
    render(<ApplicationForm application={app} />);

    const location = screen.getByRole('textbox', { name: 'Location' });
    fireEvent.change(location, { target: { value: 'Bengaluru' } });
    fireEvent.blur(location);

    expect(currentApp(app.id).location).toBe('Bengaluru');
  });

  it('persists salary range on blur', () => {
    const app = seedApplication();
    render(<ApplicationForm application={app} />);

    const salaryInput = screen.getByPlaceholderText('₹18–24L');
    fireEvent.change(salaryInput, { target: { value: '₹20–30L' } });
    fireEvent.blur(salaryInput);

    expect(currentApp(app.id).salaryRange).toBe('₹20–30L');
  });

  it('persists the remote select immediately on change', () => {
    const app = seedApplication();
    render(<ApplicationForm application={app} />);

    fireEvent.change(screen.getByDisplayValue('Not specified'), { target: { value: 'remote' } });

    expect(currentApp(app.id).remote).toBe('remote');
  });

  it('persists notes on blur', () => {
    const app = seedApplication();
    render(<ApplicationForm application={app} />);

    const notes = screen.getByRole('textbox', { name: 'Notes' });
    fireEvent.change(notes, { target: { value: 'Great first call.' } });
    fireEvent.blur(notes);

    expect(currentApp(app.id).notes).toBe('Great first call.');
  });

  it('adds and removes tags', () => {
    const app = seedApplication();
    const { rerender } = render(<ApplicationForm application={app} />);

    const tagInput = screen.getByLabelText('Tags');
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    expect(currentApp(app.id).tags).toEqual(['react']);
    // ApplicationForm reads tags straight from props (no local copy), so in
    // real usage a store update re-renders it via the parent; simulate that here.
    rerender(<ApplicationForm application={currentApp(app.id)} />);

    fireEvent.click(screen.getByLabelText('Remove tag react'));
    expect(currentApp(app.id).tags).toEqual([]);
  });

  it('adds a contact row and persists edits, then removes it', () => {
    const app = seedApplication();
    render(<ApplicationForm application={app} />);

    fireEvent.click(screen.getByText('Add contact'));
    expect(currentApp(app.id).contacts).toHaveLength(1);

    const nameInput = screen.getByLabelText('Contact name');
    fireEvent.change(nameInput, { target: { value: 'Jane Recruiter' } });
    fireEvent.blur(nameInput);

    expect(currentApp(app.id).contacts[0].name).toBe('Jane Recruiter');

    fireEvent.click(screen.getByLabelText('Remove contact'));
    expect(currentApp(app.id).contacts).toHaveLength(0);
  });

  it('shows a safe http(s) URL as a real link, target=_blank rel=noopener noreferrer', () => {
    const app = seedApplication();
    render(<ApplicationForm application={app} />);

    const urlInput = screen.getByPlaceholderText('https://…');
    fireEvent.change(urlInput, { target: { value: 'https://jobs.example.com/123' } });

    const link = screen.getByRole('link', { name: /Open job posting/ });
    expect(link).toHaveAttribute('href', 'https://jobs.example.com/123');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a javascript: URL as inert text, not a link', () => {
    const app = seedApplication();
    render(<ApplicationForm application={app} />);

    const urlInput = screen.getByPlaceholderText('https://…');
    fireEvent.change(urlInput, { target: { value: 'javascript:alert(1)' } });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/Not a valid http\/https link/)).toBeInTheDocument();
  });
});
