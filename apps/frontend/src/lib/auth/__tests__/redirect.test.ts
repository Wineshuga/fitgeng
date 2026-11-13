import { safeNextPath } from '../redirect';

describe('safeNextPath (open-redirect guard for ?next=)', () => {
  it.each([
    ['/manage/ikoyi/payments', '/manage/ikoyi/payments'],
    ['/player?tab=schedule', '/player?tab=schedule'],
    ['/sports/tennis#groups', '/sports/tennis#groups'],
  ])('keeps same-site path %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    'javascript:alert(1)',
    '/\r\nSet-Cookie:x',
    '/\tevil',
    'evil.com',
    '',
  ])('rejects %j', (input) => {
    expect(safeNextPath(input)).toBe('/player');
  });

  it('keeps percent-encoded characters encoded (inert, still same-site)', () => {
    expect(safeNextPath('/%0d%0aSet-Cookie:x')).toBe('/%0d%0aSet-Cookie:x');
  });

  it('uses the given fallback', () => {
    expect(safeNextPath(null, '/manage')).toBe('/manage');
  });
});
