import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUiStore } from '../../store/useUiStore';
import CorruptDataNotice from './CorruptDataNotice';

describe('CorruptDataNotice', () => {
  it('renders nothing when no corruption was recovered', () => {
    useUiStore.setState({ corruptDataRecovered: false });
    const { container } = render(<CorruptDataNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a non-blocking status notice when corruption was recovered', () => {
    useUiStore.setState({ corruptDataRecovered: true });
    render(<CorruptDataNotice />);

    expect(screen.getByRole('status')).toHaveTextContent(/couldn't be read/i);
  });

  it('dismiss button clears the notice', () => {
    useUiStore.setState({ corruptDataRecovered: true });
    render(<CorruptDataNotice />);

    fireEvent.click(screen.getByLabelText('Dismiss notice'));

    expect(useUiStore.getState().corruptDataRecovered).toBe(false);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
