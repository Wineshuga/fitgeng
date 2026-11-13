/**
 * Validates a post-login return path (the `next` query parameter) so it can only
 * point inside this site. Blocks open redirects such as `//evil.com`,
 * `https://evil.com`, `/\evil.com` and `javascript:` URLs; anything suspicious
 * falls back to `fallback`.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/player'): string {
  if (!next || typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  // Control characters and backslashes can be normalised by browsers into a host.
  const unsafeChar = [...next].some((ch) => {
    const code = ch.charCodeAt(0);
    return ch === '\\' || code < 0x20 || code === 0x7f;
  });
  if (unsafeChar) return fallback;
  try {
    // Must stay on the same origin once resolved.
    const url = new URL(next, 'http://same.origin');
    if (url.origin !== 'http://same.origin') return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
