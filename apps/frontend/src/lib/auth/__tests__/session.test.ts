import { getSession, requireManageContext } from '../session';
import { mockSessionApi, navigationMock, setCookies } from '@/test/serverMocks';
import { membership, session } from '@/test/sessions';

jest.mock('next/headers', () => jest.requireActual('@/test/serverMocks').headersMock);
jest.mock('next/navigation', () => jest.requireActual('@/test/serverMocks').navigationMock);

describe('getSession', () => {
  it('returns null without calling the API when there is no session cookie', async () => {
    setCookies({});
    const api = mockSessionApi(session(['player']));
    expect(await getSession()).toBeNull();
    expect(api).not.toHaveBeenCalled();
  });

  it('asks the internal API, forwarding only the session cookie', async () => {
    setCookies({ fg_rt: 'opaque-token', other: 'x' });
    const api = mockSessionApi(session(['coach']));
    const result = await getSession();
    expect(result?.user.capabilities).toEqual(['coach']);
    const [url, init] = api.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://localhost:4000/api/v1/auth/session');
    expect((init.headers as Record<string, string>).cookie).toBe('fg_rt=opaque-token');
    expect(init.cache).toBe('no-store');
  });

  it('treats a rejected session as signed out', async () => {
    setCookies({ fg_rt: 'expired' });
    mockSessionApi(401);
    expect(await getSession()).toBeNull();
  });

  it('treats an unreachable API as signed out instead of crashing the page', async () => {
    setCookies({ fg_rt: 't' });
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch;
    expect(await getSession()).toBeNull();
  });
});

describe('requireManageContext', () => {
  beforeEach(() => setCookies({ fg_rt: 't' }));

  it('redirects signed-out users to login with a return path', async () => {
    mockSessionApi(401);
    await expect(requireManageContext('ikoyi')).rejects.toThrow('REDIRECT:/login?next=%2Fmanage%2Fikoyi');
  });

  it("returns 404 for an organisation the user doesn't belong to", async () => {
    mockSessionApi(session(['coach', 'organiser'], [membership('yaba', 'owner')]));
    await expect(requireManageContext('ikoyi')).rejects.toThrow('NOT_FOUND');
    expect(navigationMock.notFound).toHaveBeenCalled();
  });

  it('resolves permissions from capabilities and the role in that organisation', async () => {
    mockSessionApi(session(['player', 'organiser'], [membership('ikoyi', 'admin')]));
    const ctx = await requireManageContext('ikoyi');
    expect(ctx.membership.slug).toBe('ikoyi');
    expect(ctx.permissions).toContain('fixtures.manage');
    expect(ctx.permissions).not.toContain('assessments.manage');
  });
});
