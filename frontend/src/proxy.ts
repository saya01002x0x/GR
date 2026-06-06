import type { NextFetchEvent, NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './libs/I18nRouting';

const handleI18nRouting = createMiddleware(routing);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/admin(.*)',
  '/:locale/admin(.*)',
]);

function getLocalePrefix(pathname: string) {
  const [, maybeLocale] = pathname.split('/');

  if (maybeLocale && routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
    return maybeLocale === routing.defaultLocale ? '' : `/${maybeLocale}`;
  }

  return '';
}

function isBanRoute(pathname: string) {
  return pathname === '/ban' || routing.locales.some(locale => pathname === `/${locale}/ban`);
}

export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  return clerkMiddleware(async (auth, req) => {
    const { userId, getToken } = await auth();

    if (userId && !isBanRoute(req.nextUrl.pathname)) {
      const token = await getToken();

      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          });

          if (response.ok) {
            const user = await response.json() as { isBanned?: boolean };

            if (user.isBanned) {
              const banUrl = req.nextUrl.clone();
              banUrl.pathname = `${getLocalePrefix(req.nextUrl.pathname)}/ban`;
              banUrl.search = '';
              return Response.redirect(banUrl);
            }
          }
        } catch {
          // Keep routing available if the API is temporarily unavailable.
        }
      }
    }

    if (isProtectedRoute(req)) {
      const locale = req.nextUrl.pathname.match(/(\/.*)\/(?:dashboard|admin)/)?.at(1) ?? '';

      const signInUrl = new URL(`${locale}/sign-in`, req.url);

      await auth.protect({
        unauthenticatedUrl: signInUrl.toString(),
      });
    }

    return handleI18nRouting(req);
  })(request, event);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next`, `/_vercel` or `monitoring`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
};
