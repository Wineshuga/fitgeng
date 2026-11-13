import type { ReactElement } from 'react';
import { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { resolveOrgPermissions } from '@fitgeng/shared';
import { Providers } from '../providers';
import PublicLayout from '../(public)/layout';
import LandingPage from '../(public)/page';
import SportPage from '../(public)/sports/[slug]/page';
import { PlayerLayout } from '@/layouts/PlayerLayout';
import { ManageShell } from '@/features/manage/components/ManageShell';
import { allowedModuleKeys } from '@/features/manage/modules';
import { membership } from '@/test/sessions';
import { healthy, mockApi, testSports } from '@/test/mockApi';

// This test drives React directly rather than through Testing Library, so enable act() support itself.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/navigation', () => ({
  usePathname: () => '/manage/ikoyi/attendance',
  useRouter: () => ({ push: jest.fn() }),
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));

/**
 * Server-renders a tree to HTML, then hydrates that HTML in jsdom exactly as
 * the browser would. Fails on any hydration mismatch (React reports those as
 * recoverable errors) or any console error during hydration.
 */
async function expectCleanHydration(tree: ReactElement, options: { dark?: boolean } = {}) {
  const { recoverable, errors } = await hydrate(tree, options);
  expect(recoverable).toEqual([]);
  expect(errors).toEqual([]);
}

/** `clientTree` lets the control case hydrate something different from what the server rendered. */
async function hydrate(tree: ReactElement, { dark = false, clientTree = tree }: { dark?: boolean; clientTree?: ReactElement } = {}) {
  const html = renderToString(<Providers>{tree}</Providers>);

  // Simulate the browser state themeInitScript produces before React loads.
  document.documentElement.classList.toggle('dark', dark);
  if (dark) localStorage.setItem('fg:theme', 'dark');

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  const recoverable: unknown[] = [];
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  await act(async () => {
    hydrateRoot(container, <Providers>{clientTree}</Providers>, { onRecoverableError: (e) => recoverable.push(e) });
  });

  const errors = consoleError.mock.calls.map((c) => String(c[0]));
  consoleError.mockRestore();
  container.remove();
  return { recoverable, errors };
}

describe('hydration (server HTML matches the first client render)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockApi({
      '/health': { body: healthy },
      '/sports': { body: { data: testSports } },
      '/sports/tennis': { body: { data: testSports[0] } },
    });
  });

  it('control: the harness does detect a real mismatch', async () => {
    const { recoverable } = await hydrate(<p>server</p>, { clientTree: <p>client</p> });
    expect(recoverable.length).toBeGreaterThan(0);
  });

  it('landing page in light mode', async () => {
    await expectCleanHydration(<PublicLayout>{await LandingPage()}</PublicLayout>);
  });

  it('landing page with a stored dark preference', async () => {
    await expectCleanHydration(<PublicLayout>{await LandingPage()}</PublicLayout>, { dark: true });
  });

  it('server-rendered sport page', async () => {
    const page = await SportPage({ params: Promise.resolve({ slug: 'tennis' }) });
    await expectCleanHydration(<PublicLayout>{page}</PublicLayout>, { dark: true });
  });

  it('player layout', async () => {
    await expectCleanHydration(
      <PlayerLayout>
        <h1>Home</h1>
      </PlayerLayout>,
    );
  });

  it('management shell with an active organisation stored from a previous visit', async () => {
    localStorage.setItem('fg:activeOrgId', 'stale-value-from-old-version');
    const ikoyi = membership('ikoyi', 'owner', 'Ikoyi Tennis Academy');
    const yaba = membership('yaba', 'coach', 'Yaba Ballers');
    await expectCleanHydration(
      <ManageShell
        org={ikoyi}
        memberships={[ikoyi, yaba]}
        capabilities={['coach', 'organiser']}
        allowedModules={allowedModuleKeys(resolveOrgPermissions(['coach', 'organiser'], 'owner'))}
        userName="Ada Obi"
      >
        <h1>Attendance</h1>
      </ManageShell>,
      { dark: true },
    );
  });
});
