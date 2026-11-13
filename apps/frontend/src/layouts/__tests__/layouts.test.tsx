import { screen, within } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { PlayerLayout } from '../PlayerLayout';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn() }),
}));
const mockPathname = usePathname as jest.Mock;

describe('PlayerLayout', () => {
  it('renders a five-item mobile tab bar and marks the current page', () => {
    mockPathname.mockReturnValue('/player/schedule');
    renderWithProviders(
      <PlayerLayout>
        <h1>Schedule</h1>
      </PlayerLayout>,
    );
    const tabs = screen.getByRole('navigation', { name: 'Player tabs' });
    expect(within(tabs).getAllByRole('link')).toHaveLength(5);
    expect(within(tabs).getByRole('link', { name: 'Schedule' })).toHaveAttribute('aria-current', 'page');
    expect(within(tabs).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('heading', { name: 'Schedule' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });
});
