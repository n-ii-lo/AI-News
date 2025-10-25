import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewItemsBanner } from '@/components/NewItemsBanner';

describe('NewItemsBanner', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('should render with count and live status', () => {
    render(
      <NewItemsBanner
        count={5}
        onClick={mockOnClick}
        isLive={true}
      />
    );

    expect(screen.getByText('New (5)')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Press Enter or Space to load new items')).toBeInTheDocument();
  });

  it('should render offline status when not live', () => {
    render(
      <NewItemsBanner
        count={3}
        onClick={mockOnClick}
        isLive={false}
      />
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should call onClick when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <NewItemsBanner
        count={2}
        onClick={mockOnClick}
        isLive={true}
      />
    );

    const button = screen.getByRole('button', { name: /show 2 new items/i });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when Enter key is pressed', async () => {
    const user = userEvent.setup();
    
    render(
      <NewItemsBanner
        count={1}
        onClick={mockOnClick}
        isLive={true}
      />
    );

    const button = screen.getByRole('button', { name: /show 1 new items/i });
    button.focus();
    await user.keyboard('{Enter}');

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when Space key is pressed', async () => {
    const user = userEvent.setup();
    
    render(
      <NewItemsBanner
        count={4}
        onClick={mockOnClick}
        isLive={true}
      />
    );

    const button = screen.getByRole('button', { name: /show 4 new items/i });
    button.focus();
    await user.keyboard(' ');

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    render(
      <NewItemsBanner
        count={3}
        onClick={mockOnClick}
        isLive={true}
      />
    );

    const banner = screen.getByRole('banner');
    expect(banner).toHaveAttribute('aria-live', 'polite');

    const button = screen.getByRole('button', { name: /show 3 new items/i });
    expect(button).toHaveAttribute('aria-label', 'Show 3 new items');
  });

  it('should not render when count is 0', () => {
    const { container } = render(
      <NewItemsBanner
        count={0}
        onClick={mockOnClick}
        isLive={true}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should apply custom className', () => {
    render(
      <NewItemsBanner
        count={2}
        onClick={mockOnClick}
        isLive={true}
        className="custom-class"
      />
    );

    const banner = screen.getByRole('banner');
    expect(banner).toHaveClass('custom-class');
  });

  it('should show pulse animation on button', () => {
    render(
      <NewItemsBanner
        count={1}
        onClick={mockOnClick}
        isLive={true}
      />
    );

    const button = screen.getByRole('button', { name: /show 1 new items/i });
    expect(button).toHaveClass('animate-pulse');
  });
});
