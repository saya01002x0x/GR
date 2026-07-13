import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Các route có thể truy cập public (không cần đăng nhập)
const isPublicRoute = createRouteMatcher([
  '/',
  '/:locale',
  '/:locale/discover',
  '/:locale/search',
  '/:locale/feed',
  '/:locale/artists/(.*)',
  '/:locale/artworks/(.*)',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/api/(.*)',
  '/trpc/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
