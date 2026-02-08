// Next.js middleware for route protection
// Implements T015 from tasks.md
// SECURITY: Uses httpOnly cookies for authentication (XSS protection)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect routes and handle authentication
 * Runs at the edge before any page renders
 * SECURITY: Checks for auth_token in httpOnly cookie
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // SECURITY: Get token from httpOnly cookie (set by backend)
  const token = request.cookies.get('auth_token')?.value;

  // Define protected routes (require authentication)
  const protectedRoutes = ['/tasks', '/dashboard'];

  // Define auth routes (redirect to dashboard if already authenticated)
  const authRoutes = ['/signin', '/signup'];

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If accessing protected route without token, redirect to signin
  if (isProtectedRoute && !token) {
    const signinUrl = new URL('/signin', request.url);
    // Add redirect parameter to return to original page after signin
    signinUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // If accessing auth route with valid token, redirect to tasks
  if (isAuthRoute && token) {
    const tasksUrl = new URL('/tasks', request.url);
    return NextResponse.redirect(tasksUrl);
  }

  // Allow request to proceed
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
