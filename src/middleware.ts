import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes based on the request
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/rooms' // GET api/rooms is technically public, though we mainly need the ID route GET. Let's make it explicitly open.
]);

// Note: /room/* requires auth
const isProtectedRoute = createRouteMatcher([
  '/room(.*)'
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
