import { NextResponse, type NextRequest } from 'next/server';
import { COOKIES } from '@fitgeng/shared';

/**
 * First, cheap gate for signed-in areas (Next.js 16 "proxy", formerly middleware).
 * It only checks that a session cookie exists, which saves a render and an API
 * call for anonymous visitors. It isn't the security boundary: layouts validate
 * the session with the API (requireSession / requireManageContext), and Express
 * authorises every API request.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(COOKIES.refreshToken)) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = '/login';
  login.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/manage/:path*', '/player/:path*'],
};
