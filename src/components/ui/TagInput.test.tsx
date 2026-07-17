import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TagInput from './TagInput';

describe('TagInput', () => {
  it('renders existing tags', () => {
    render(<TagInput tags={['react', 'remote']} onChange={vi.fn()} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('remote')).toBeInTheDocument();
  });

  it('adds a tag on Enter', () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'frontend' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['frontend']);
  });

  it('adds a tag on comma', () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'frontend' } });
    fireEvent.keyDown(input, { key: ',' });

    expect(onChange).toHaveBeenCalledWith(['frontend']);
  });

  it('does not add a duplicate tag', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['frontend']} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'frontend' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes a tag via its remove button', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['frontend', 'backend']} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Remove tag frontend'));

    expect(onChange).toHaveBeenCalledWith(['backend']);
  });

  it('removes the last tag on Backspace when the input is empty', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['frontend', 'backend']} onChange={onChange} />);

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Backspace' });

    expect(onChange).toHaveBeenCalledWith(['frontend']);
  });
});
