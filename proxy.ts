// ============================================================
// SIAP-Pro: Proxy (formerly middleware.ts)
// Route protection based on auth session cookie
// NOTE: In Next.js 16, middleware.ts is DEPRECATED -> proxy.ts
// ============================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login']
const PROTECTED_PREFIXES = ['/dashboard', '/penugasan', '/pelaporan', '/persidangan', '/dokumentasi', '/admin']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Check for auth session cookie (set by the auth store via localStorage in client)
  // NOTE: For full server-side auth, integrate Supabase SSR cookies here.
  // For now, we allow all protected routes — client-side guards handle the redirect.
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (!isProtected) {
    return NextResponse.next()
  }

  // Future: validate Supabase JWT from cookie
  // const sessionCookie = request.cookies.get('sb-access-token')
  // if (!sessionCookie) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, manifest.json, robots.txt, sitemap.xml
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|apple-icon.png|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
