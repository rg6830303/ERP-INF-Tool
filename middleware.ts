import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SESSION_START_COOKIE, getSupabaseUrl, getSupabaseAnonKey } from '@/lib/constants';

// Routes that never require authentication.
const PUBLIC_PATHS = ['/login'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the token with Supabase (getSession alone
  // trusts the cookie). This also refreshes the auth cookies on `response`.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The session-start cookie has a 6-hour max-age. If it is gone while an auth
  // session still exists, the hard 6-hour window has elapsed => force logout.
  const sessionStart = request.cookies.get(SESSION_START_COOKIE)?.value;

  const authed = Boolean(user);
  const withinWindow = Boolean(sessionStart);

  // Already on a public page.
  if (isPublic(pathname)) {
    if (authed && withinWindow && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
  }

  // Protected page, but no valid auth.
  if (!authed) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Authenticated but the 6-hour window has closed.
  if (!withinWindow) {
    await supabase.auth.signOut();
    const redirect = NextResponse.redirect(new URL('/login?expired=1', request.url));
    // Clear any lingering auth cookies on the redirect response.
    for (const c of request.cookies.getAll()) {
      if (c.name.startsWith('sb-') || c.name === SESSION_START_COOKIE) {
        redirect.cookies.set(c.name, '', { maxAge: 0, path: '/' });
      }
    }
    return redirect;
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
