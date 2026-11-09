import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { PlayerLayout } from '../PlayerLayout';
import { ManageLayout } from '../ManageLayout';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
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
  });
});

describe('ManageLayout', () => {
  it('opens the mobile drawer and closes it after navigation', async () => {
    mockPathname.mockReturnValue('/manage');
    // A fresh element each render: React skips re-rendering an identical element.
    const ui = () => (
      <ManageLayout>
        <h1>Dashboard</h1>
      </ManageLayout>
    );
    const { rerender } = renderWithProviders(ui());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    const drawer = screen.getByRole('dialog', { name: 'Navigation' });
    expect(within(drawer).getByRole('link', { name: 'Players' })).toHaveAttribute('href', '/manage/players');

    // Simulate the route change that follows clicking a drawer link.
    mockPathname.mockReturnValue('/manage/players');
    act(() => rerender(ui()));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('filters the menu by capability', () => {
    mockPathname.mockReturnValue('/manage');
    renderWithProviders(
      <ManageLayout capabilities={['organiser']}>
        <p>content</p>
      </ManageLayout>,
    );
    const nav = screen.getAllByRole('navigation', { name: 'Management' })[0]!;
    expect(within(nav).getByRole('link', { name: 'Teams' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Attendance' })).not.toBeInTheDocument();
  });
});
