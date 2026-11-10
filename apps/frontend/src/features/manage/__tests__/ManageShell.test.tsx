import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter } from 'next/navigation';
import { resolveOrgPermissions, type Capability, type SessionMembership } from '@fitgeng/shared';
import { renderWithProviders } from '@/test/renderWithProviders';
import { membership } from '@/test/sessions';
import { allowedModuleKeys } from '../modules';
import { ManageShell } from '../components/ManageShell';

jest.mock('next/navigation', () => ({ usePathname: jest.fn(), useRouter: jest.fn() }));
const mockPathname = usePathname as jest.Mock;
const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });

function shell(caps: Capability[], current: SessionMembership, memberships: SessionMembership[] = [current]) {
  return (
    <ManageShell
      org={current}
      memberships={memberships}
      capabilities={caps}
      allowedModules={allowedModuleKeys(resolveOrgPermissions(caps, current.role))}
      userName="Ada Obi"
    >
      <h1>Content</h1>
    </ManageShell>
  );
}

const sidebar = () => screen.getAllByRole('navigation', { name: 'Management' })[0]!;

describe('ManageShell', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/manage/ikoyi');
    push.mockClear();
    document.cookie = 'fg_last_org=; Path=/manage; Max-Age=0';
  });

  it('shows coaching tools to a coach, scoped to the current organisation', () => {
    renderWithProviders(shell(['player', 'coach'], membership('ikoyi', 'owner')));
    const nav = sidebar();
    expect(within(nav).getByRole('group', { name: 'Coaching' })).toBeInTheDocument();
    expect(within(nav).queryByRole('group', { name: 'Competitions' })).not.toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Assessments' })).toHaveAttribute('href', '/manage/ikoyi/assessments');
    expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows competition tools to an organiser', () => {
    renderWithProviders(shell(['player', 'organiser'], membership('ikoyi', 'owner')));
    const nav = sidebar();
    expect(within(nav).getByRole('link', { name: 'Fixtures' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Assessments' })).not.toBeInTheDocument();
  });

  it('shows both families in the same navigation to a coach-and-organiser', () => {
    renderWithProviders(shell(['coach', 'organiser'], membership('ikoyi', 'admin')));
    const nav = sidebar();
    expect(within(nav).getByRole('group', { name: 'Coaching' })).toBeInTheDocument();
    expect(within(nav).getByRole('group', { name: 'Competitions' })).toBeInTheDocument();
  });

  it('hides payments and settings from an org-appointed coach', () => {
    renderWithProviders(shell(['player'], membership('ikoyi', 'coach')));
    const nav = sidebar();
    expect(within(nav).queryByRole('link', { name: 'Payments' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Attendance' })).toBeInTheDocument();
  });

  it('remembers the current organisation for /manage', () => {
    // The cookie is scoped to Path=/manage, so read it from a /manage URL.
    window.history.pushState({}, '', '/manage/ikoyi');
    renderWithProviders(shell(['coach'], membership('ikoyi', 'owner')));
    expect(document.cookie).toContain('fg_last_org=ikoyi');
  });

  describe('organisation switcher', () => {
    const ikoyi = membership('ikoyi', 'owner', 'Ikoyi Tennis Academy');
    const yaba = membership('yaba', 'coach', 'Yaba Ballers');

    it('shows a plain label for a single organisation', () => {
      renderWithProviders(shell(['coach'], ikoyi));
      expect(screen.queryByRole('combobox', { name: 'Organisation' })).not.toBeInTheDocument();
      expect(screen.getAllByText('Ikoyi Tennis Academy').length).toBeGreaterThan(0);
    });

    it('keeps the current module when the target organisation allows it', async () => {
      mockPathname.mockReturnValue('/manage/ikoyi/attendance');
      renderWithProviders(shell(['coach'], ikoyi, [ikoyi, yaba]));
      await userEvent.selectOptions(screen.getAllByRole('combobox', { name: 'Organisation' })[0]!, 'yaba');
      expect(push).toHaveBeenCalledWith('/manage/yaba/attendance');
    });

    it("falls back to the overview when the module isn't allowed there", async () => {
      mockPathname.mockReturnValue('/manage/ikoyi/payments');
      renderWithProviders(shell(['coach'], ikoyi, [ikoyi, yaba]));
      await userEvent.selectOptions(screen.getAllByRole('combobox', { name: 'Organisation' })[0]!, 'yaba');
      expect(push).toHaveBeenCalledWith('/manage/yaba');
    });
  });

  it('opens the mobile drawer and closes it after navigation', async () => {
    const ui = () => shell(['coach'], membership('ikoyi', 'owner'));
    const { rerender } = renderWithProviders(ui());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    const drawer = screen.getByRole('dialog', { name: 'Navigation' });
    expect(within(drawer).getByRole('link', { name: 'Players' })).toHaveAttribute('href', '/manage/ikoyi/players');

    // Simulate the route change that follows clicking a drawer link (fresh element so React re-renders).
    mockPathname.mockReturnValue('/manage/ikoyi/players');
    act(() => rerender(ui()));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
