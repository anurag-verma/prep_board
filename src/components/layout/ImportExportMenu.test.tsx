import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { useQuestionStore } from '../../store/useQuestionStore';
import { DEFAULT_STAGES } from '../../types/models';
import ImportExportMenu from './ImportExportMenu';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
  useQuestionStore.setState({ questions: [] });
});

function makeJsonFile(content: unknown, name = 'export.json') {
  return new File([JSON.stringify(content)], name, { type: 'application/json' });
}

async function selectFile(file: File) {
  const input = screen.getByLabelText('Import JSON file') as HTMLInputElement;
  await fireEvent.change(input, { target: { files: [file] } });
}

describe('ImportExportMenu', () => {
  it('exports the current board+question data as a downloaded JSON file', () => {
    useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<ImportExportMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Import/Export' }));
    fireEvent.click(screen.getByRole('button', { name: /Export JSON/ }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  it('exports applications as a CSV file with a UTF-8 BOM and formula-injection escaped', async () => {
    useBoardStore.getState().addApplication({
      company: '=HYPERLINK("http://evil.example")',
      role: 'Engineer',
    });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    let capturedBlob: Blob | undefined;
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      capturedBlob = blob as Blob;
      return 'blob:mock';
    });
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<ImportExportMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Import/Export' }));
    fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(capturedBlob).toBeDefined();
    expect(capturedBlob!.type).toContain('text/csv');

    // jsdom's Blob has no .text(); read it via FileReader instead (same
    // workaround as the File.text() gap hit in PB-050). Read raw bytes for
    // the BOM check specifically — readAsText decodes UTF-8 and strips the
    // BOM as part of normal decoding (standard behavior, not jsdom-specific),
    // so it can't be used to verify the BOM is actually present on disk.
    const bytes = await new Promise<Uint8Array>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(capturedBlob!);
    });
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM bytes

    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(capturedBlob!);
    });
    expect(text).toContain("'=HYPERLINK"); // formula-injection neutralized

    clickSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  it('shows validation errors for a hostile/invalid file and does not offer Replace/Merge', async () => {
    render(<ImportExportMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Import/Export' }));
    fireEvent.click(screen.getByRole('button', { name: /Import JSON/ }));

    await selectFile(makeJsonFile({ schemaVersion: 1, stages: [], applications: [], questions: [] }));

    await waitFor(() => expect(screen.getByText('Import rejected:')).toBeInTheDocument());
    expect(screen.queryByText('Merge with existing')).not.toBeInTheDocument();
  });

  it('offers Replace/Merge for a valid file, and Merge applies without wiping existing data', async () => {
    useBoardStore.getState().addApplication({ company: 'Existing Co', role: 'Existing Role' });

    render(<ImportExportMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Import/Export' }));
    fireEvent.click(screen.getByRole('button', { name: /Import JSON/ }));

    await selectFile(
      makeJsonFile({
        schemaVersion: 1,
        stages: DEFAULT_STAGES,
        applications: [
          {
            id: 'imported-1',
            company: 'Imported Co',
            role: 'Imported Role',
            stageId: DEFAULT_STAGES[0].id,
            priority: false,
            tags: [],
            contacts: [],
            notes: '',
            rounds: [],
            events: [],
            createdAt: new Date().toISOString(),
            archivedAt: null,
          },
        ],
        questions: [],
      }),
    );

    await waitFor(() => expect(screen.getByText('Merge with existing')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Merge with existing'));

    const companies = useBoardStore.getState().applications.map((a) => a.company).sort();
    expect(companies).toEqual(['Existing Co', 'Imported Co']);
  });

  it('Replace requires confirmation and replaces all data when confirmed', async () => {
    useBoardStore.getState().addApplication({ company: 'Existing Co', role: 'Existing Role' });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ImportExportMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Import/Export' }));
    fireEvent.click(screen.getByRole('button', { name: /Import JSON/ }));

    await selectFile(
      makeJsonFile({
        schemaVersion: 1,
        stages: DEFAULT_STAGES,
        applications: [],
        questions: [],
      }),
    );

    await waitFor(() => expect(screen.getByText('Replace all data')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Replace all data'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(useBoardStore.getState().applications).toHaveLength(0);
    confirmSpy.mockRestore();
  });

  it('Replace does nothing when confirmation is cancelled', async () => {
    useBoardStore.getState().addApplication({ company: 'Existing Co', role: 'Existing Role' });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ImportExportMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Import/Export' }));
    fireEvent.click(screen.getByRole('button', { name: /Import JSON/ }));

    await selectFile(
      makeJsonFile({ schemaVersion: 1, stages: DEFAULT_STAGES, applications: [], questions: [] }),
    );

    await waitFor(() => expect(screen.getByText('Replace all data')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Replace all data'));

    expect(useBoardStore.getState().applications).toHaveLength(1);
    confirmSpy.mockRestore();
  });
});
