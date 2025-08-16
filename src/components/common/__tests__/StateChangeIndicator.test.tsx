import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StateChangeIndicator } from '../StateChangeIndicator';

describe('StateChangeIndicator', () => {
  it('should render children without highlight initially', () => {
    render(
      <StateChangeIndicator isChanged={false}>
        <span>Test Content</span>
      </StateChangeIndicator>
    );

    const content = screen.getByText('Test Content');
    expect(content).toBeInTheDocument();
    expect(content.parentElement).not.toHaveClass(
      'pf-v6-u-background-color-warning-100'
    );
  });

  it('should apply highlight class when isChanged is true', () => {
    render(
      <StateChangeIndicator isChanged={true}>
        <span>Test Content</span>
      </StateChangeIndicator>
    );

    const content = screen.getByText('Test Content');
    expect(content.parentElement).toHaveClass(
      'pf-v6-u-background-color-warning-100'
    );
  });

  it('should remove highlight after duration', async () => {
    const { rerender } = render(
      <StateChangeIndicator isChanged={false} highlightDuration={100}>
        <span>Test Content</span>
      </StateChangeIndicator>
    );

    const content = screen.getByText('Test Content');
    expect(content.parentElement).not.toHaveClass(
      'pf-v6-u-background-color-warning-100'
    );

    // Trigger change
    rerender(
      <StateChangeIndicator isChanged={true} highlightDuration={100}>
        <span>Test Content</span>
      </StateChangeIndicator>
    );

    expect(content.parentElement).toHaveClass(
      'pf-v6-u-background-color-warning-100'
    );

    // Wait for highlight to disappear
    await waitFor(
      () => {
        expect(content.parentElement).not.toHaveClass(
          'pf-v6-u-background-color-warning-100'
        );
      },
      { timeout: 200 }
    );
  });

  it('should apply custom className', () => {
    render(
      <StateChangeIndicator isChanged={false} className="custom-class">
        <span>Test Content</span>
      </StateChangeIndicator>
    );

    const content = screen.getByText('Test Content');
    expect(content.parentElement).toHaveClass('custom-class');
  });
});
