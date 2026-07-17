import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import MarkdownLiteEditor from './MarkdownLiteEditor';

function ControlledEditor({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <MarkdownLiteEditor value={value} onChange={setValue} aria-label="Notes" />;
}

describe('MarkdownLiteEditor', () => {
  it('wraps the selected text in ** when Bold is clicked', () => {
    render(<ControlledEditor initial="hello world" />);
    const textarea = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    textarea.setSelectionRange(6, 11); // "world"

    fireEvent.click(screen.getByLabelText('Bold'));

    expect(textarea.value).toBe('hello **world**');
  });

  it('wraps the selected text in * when Italic is clicked', () => {
    render(<ControlledEditor initial="hello world" />);
    const textarea = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 5); // "hello"

    fireEvent.click(screen.getByLabelText('Italic'));

    expect(textarea.value).toBe('*hello* world');
  });

  it('prefixes the current line with "- " when Bullet list is clicked', () => {
    render(<ControlledEditor initial="todo item" />);
    const textarea = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 0);

    fireEvent.click(screen.getByLabelText('Bullet list'));

    expect(textarea.value).toBe('- todo item');
  });

  it('inserts placeholder bold text when nothing is selected', () => {
    render(<ControlledEditor initial="" />);
    const textarea = screen.getByLabelText('Notes') as HTMLTextAreaElement;

    fireEvent.click(screen.getByLabelText('Bold'));

    expect(textarea.value).toBe('**text**');
  });

  it('calls onBlur when the textarea loses focus', () => {
    const onBlur = vi.fn();
    render(<MarkdownLiteEditor value="content" onChange={vi.fn()} onBlur={onBlur} aria-label="Notes" />);

    fireEvent.blur(screen.getByLabelText('Notes'));

    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
