import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from '../../store/useUiStore';
import PrivacyModal from './PrivacyModal';

beforeEach(() => {
  useUiStore.setState({ privacyModalOpen: true });
});

describe('PrivacyModal', () => {
  it('states data never leaves the device', () => {
    render(<PrivacyModal />);
    expect(screen.getByText('Everything stays on your device.')).toBeInTheDocument();
  });

  it('mentions exporting a backup and Delete all data for shared computers', () => {
    render(<PrivacyModal />);
    expect(screen.getByText(/shared or work computer/i)).toBeInTheDocument();
    expect(screen.getByText('Delete all data')).toBeInTheDocument();
  });

  it('"Got it" closes the modal', () => {
    render(<PrivacyModal />);
    fireEvent.click(screen.getByText('Got it'));

    expect(useUiStore.getState().privacyModalOpen).toBe(false);
  });
});
