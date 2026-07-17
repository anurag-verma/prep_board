import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuestionStore } from '../../store/useQuestionStore';
import QuestionBankImportExportMenu from './QuestionBankImportExportMenu';

beforeEach(() => {
  useQuestionStore.setState({ questions: [] });
});

function makeJsonFile(content: unknown, name = 'bank.json') {
  return new File([JSON.stringify(content)], name, { type: 'application/json' });
}

async function selectFile(file: File) {
  const input = screen.getByLabelText('Import question bank JSON file') as HTMLInputElement;
  await fireEvent.change(input, { target: { files: [file] } });
}

describe('QuestionBankImportExportMenu', () => {
  it('exports the current bank as a downloaded JSON file', () => {
    useQuestionStore.getState().addQuestion({ text: 'Two Sum', category: 'dsa', difficulty: 'easy' });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<QuestionBankImportExportMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Import/Export bank' }));
    fireEvent.click(screen.getByRole('button', { name: /Export bank JSON/ }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  it('rejects an invalid bank file with reasons, offering no Merge/Replace', async () => {
    render(<QuestionBankImportExportMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Import/Export bank' }));
    fireEvent.click(screen.getByRole('button', { name: /Import bank JSON/ }));

    await selectFile(makeJsonFile({ schemaVersion: 1, questions: [{ text: 123 }] }));

    await waitFor(() => expect(screen.getByText('Import rejected:')).toBeInTheDocument());
    expect(screen.queryByText('Merge with existing')).not.toBeInTheDocument();
  });

  it('merges a valid bank file without duplicating existing questions', async () => {
    const existing = useQuestionStore
      .getState()
      .addQuestion({ text: 'Existing Q', category: 'dsa', difficulty: 'easy' });

    render(<QuestionBankImportExportMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Import/Export bank' }));
    fireEvent.click(screen.getByRole('button', { name: /Import bank JSON/ }));

    await selectFile(
      makeJsonFile({
        schemaVersion: 1,
        questions: [
          { ...existing }, // same id -> should not duplicate
          {
            id: 'new-q',
            text: 'Imported Q',
            category: 'sql',
            difficulty: 'hard',
            answerNotes: '',
            confidence: 3,
            companyIds: [],
            createdAt: new Date().toISOString(),
            lastReviewedAt: null,
          },
        ],
      }),
    );

    await waitFor(() => expect(screen.getByText('Merge with existing')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Merge with existing'));

    const texts = useQuestionStore.getState().questions.map((q) => q.text).sort();
    expect(texts).toEqual(['Existing Q', 'Imported Q']);
  });

  it('Replace requires confirmation and replaces the whole bank', async () => {
    useQuestionStore.getState().addQuestion({ text: 'Existing Q', category: 'dsa', difficulty: 'easy' });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<QuestionBankImportExportMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Import/Export bank' }));
    fireEvent.click(screen.getByRole('button', { name: /Import bank JSON/ }));

    await selectFile(makeJsonFile({ schemaVersion: 1, questions: [] }));
    await waitFor(() => expect(screen.getByText('Replace bank')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Replace bank'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(useQuestionStore.getState().questions).toHaveLength(0);
    confirmSpy.mockRestore();
  });
});
