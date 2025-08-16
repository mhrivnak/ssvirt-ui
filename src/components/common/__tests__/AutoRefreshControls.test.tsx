import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AutoRefreshControls } from '../AutoRefreshControls';

describe('AutoRefreshControls', () => {
  const defaultProps = {
    isEnabled: true,
    onToggle: vi.fn(),
    onManualRefresh: vi.fn(),
    isLoading: false,
    lastUpdated: new Date('2024-01-15T10:30:00Z'),
  };

  it('should render all controls', () => {
    render(<AutoRefreshControls {...defaultProps} />);

    expect(screen.getByLabelText('Auto-refresh (2s)')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /refresh/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });

  it('should show checked switch when enabled', () => {
    render(<AutoRefreshControls {...defaultProps} isEnabled={true} />);

    const switchElement = screen.getByLabelText('Auto-refresh (2s)');
    expect(switchElement).toBeChecked();
  });

  it('should show unchecked switch when disabled', () => {
    render(<AutoRefreshControls {...defaultProps} isEnabled={false} />);

    const switchElement = screen.getByLabelText('Auto-refresh (2s)');
    expect(switchElement).not.toBeChecked();
  });

  it('should call onToggle when switch is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<AutoRefreshControls {...defaultProps} onToggle={onToggle} />);

    const switchElement = screen.getByLabelText('Auto-refresh (2s)');
    await user.click(switchElement);

    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('should call onManualRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const onManualRefresh = vi.fn();

    render(
      <AutoRefreshControls
        {...defaultProps}
        onManualRefresh={onManualRefresh}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(onManualRefresh).toHaveBeenCalled();
  });

  it('should disable refresh button when loading', () => {
    render(<AutoRefreshControls {...defaultProps} isLoading={true} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it('should show spinner when loading', () => {
    render(<AutoRefreshControls {...defaultProps} isLoading={true} />);

    // PatternFly spinner has the pf-v6-c-spinner class
    const spinner = document.querySelector('.pf-v6-c-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('should not show last updated when null', () => {
    render(<AutoRefreshControls {...defaultProps} lastUpdated={null} />);

    expect(screen.queryByText(/last updated/i)).not.toBeInTheDocument();
  });
});
