// Next.js middleware
//
// AUTH GATING INTENTIONALLY REMOVED (cross-domain cookie limitation):
// The auth_token is an httpOnly cookie SET BY THE BACKEND, so it is scoped to
// the backend's domain (e.g. *.hf.space), NOT the frontend's domain (Vercel).
// Edge middleware runs on the frontend domain and can only read cookies scoped
// to that domain, so `request.cookies.get('auth_token')` is ALWAYS empty here.
// Gating on it caused an infinite /tasks -> /signin redirect loop even after a
// successful login.
//
// Route protection is therefore handled CLIENT-SIDE instead:
//   - app/(dashboard)/layout.tsx validates the session via /api/auth/session
//     (credentials: 'include' sends the cross-domain cookie) and redirects to
//     /signin when there is no authenticated user.
//
// This middleware is now a pass-through. Keep it so any future non-auth edge
// logic has a home, and so the matcher config stays documented.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // No auth gating here — see file header for why. Always continue.
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
