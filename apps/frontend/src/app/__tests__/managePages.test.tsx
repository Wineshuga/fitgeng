import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockSessionApi, navigationMock, setCookies } from '@/test/serverMocks';
import { membership, session } from '@/test/sessions';
import ManageIndexPage from '../(manage)/manage/page';
import OrgManageLayout from '../(manage)/manage/[org]/layout';
import OrgOverviewPage from '../(manage)/manage/[org]/page';
import ManageModulePage from '../(manage)/manage/[org]/[module]/page';

jest.mock('next/headers', () => jest.requireActual('@/test/serverMocks').headersMock);
jest.mock('next/navigation', () => jest.requireActual('@/test/serverMocks').navigationMock);

const params = <T,>(value: T) => Promise.resolve(value);
const ikoyi = membership('ikoyi', 'owner', 'Ikoyi Tennis Academy');
const yaba = membership('yaba', 'coach', 'Yaba Ballers');

beforeEach(() => {
  setCookies({ fg_rt: 't' });
  navigationMock.usePathname.mockReturnValue('/manage/ikoyi');
});

describe('/manage entry', () => {
  it('opens the only organisation directly', async () => {
    mockSessionApi(session(['coach'], [ikoyi]));
    await expect(ManageIndexPage()).rejects.toThrow('REDIRECT:/manage/ikoyi');
  });

  it('reopens the last-used organisation', async () => {
    setCookies({ fg_rt: 't', fg_last_org: 'yaba' });
    mockSessionApi(session(['coach'], [ikoyi, yaba]));
    await expect(ManageIndexPage()).rejects.toThrow('REDIRECT:/manage/yaba');
  });

  it('ignores a remembered organisation the user no longer belongs to', async () => {
    setCookies({ fg_rt: 't', fg_last_org: 'gone' });
    mockSessionApi(session(['coach'], [ikoyi, yaba]));
    renderWithProviders(await ManageIndexPage());
    expect(screen.getByRole('heading', { name: 'Choose an organisation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Yaba Ballers/ })).toHaveAttribute('href', '/manage/yaba');
  });

  it('offers organisation setup to an approved coach without one', async () => {
    mockSessionApi(session(['player', 'coach']));
    renderWithProviders(await ManageIndexPage());
    expect(screen.getByRole('heading', { name: 'Set up your organisation' })).toBeInTheDocument();
  });

  it('explains how to get access to a player without management capabilities', async () => {
    mockSessionApi(session(['player']));
    renderWithProviders(await ManageIndexPage());
    expect(screen.getByRole('heading', { name: 'Manage a team or academy' })).toBeInTheDocument();
  });

  it('sends signed-out visitors to login', async () => {
    mockSessionApi(401);
    await expect(ManageIndexPage()).rejects.toThrow('REDIRECT:/login?next=%2Fmanage');
  });
});

describe('/manage/[org]', () => {
  it("hides organisations the user doesn't belong to (404)", async () => {
    mockSessionApi(session(['coach', 'organiser'], [yaba]));
    await expect(OrgManageLayout({ children: null, params: params({ org: 'ikoyi' }) })).rejects.toThrow('NOT_FOUND');
  });

  it('renders the shared shell with permission-filtered navigation', async () => {
    mockSessionApi(session(['player', 'organiser'], [ikoyi, yaba]));
    const shell = await OrgManageLayout({ children: <p>child</p>, params: params({ org: 'ikoyi' }) });
    renderWithProviders(shell);
    const nav = screen.getAllByRole('navigation', { name: 'Management' })[0]!;
    expect(within(nav).getByRole('group', { name: 'Competitions' })).toBeInTheDocument();
    expect(within(nav).queryByRole('group', { name: 'Coaching' })).not.toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('lists the modules the user can open on the overview', async () => {
    mockSessionApi(session(['player'], [yaba]));
    renderWithProviders(await OrgOverviewPage({ params: params({ org: 'yaba' }) }));
    expect(screen.getByRole('heading', { level: 1, name: 'Yaba Ballers' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Attendance/ })).toHaveAttribute('href', '/manage/yaba/attendance');
    expect(screen.queryByRole('link', { name: /Payments/ })).not.toBeInTheDocument();
  });
});

describe('/manage/[org]/[module]', () => {
  it('returns 404 for an unknown module', async () => {
    mockSessionApi(session(['coach'], [ikoyi]));
    await expect(ManageModulePage({ params: params({ org: 'ikoyi', module: 'nope' }) })).rejects.toThrow('NOT_FOUND');
  });

  it('returns 403 when the user lacks the permission (direct URL access)', async () => {
    mockSessionApi(session(['player', 'coach'], [ikoyi]));
    await expect(ManageModulePage({ params: params({ org: 'ikoyi', module: 'standings' }) })).rejects.toThrow('FORBIDDEN');
  });

  it('blocks an org coach from payments even by direct URL', async () => {
    mockSessionApi(session(['player'], [yaba]));
    await expect(ManageModulePage({ params: params({ org: 'yaba', module: 'payments' }) })).rejects.toThrow('FORBIDDEN');
  });

  it('renders an allowed module', async () => {
    mockSessionApi(session(['coach'], [ikoyi]));
    renderWithProviders(await ManageModulePage({ params: params({ org: 'ikoyi', module: 'assessments' }) }));
    expect(screen.getByRole('heading', { name: 'Assessments' })).toBeInTheDocument();
    expect(screen.getByText(/Phase 3d/)).toBeInTheDocument();
  });
});
