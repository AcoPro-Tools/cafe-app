import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value

  const session = token ? await verifySession(token) : null

  // 1. Protect Dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 2. Protect Admin-only API routes
  if (pathname.startsWith('/api/admin')) {
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح به: يرجى تسجيل الدخول أولاً' },
        { status: 401 }
      )
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'صلاحية غير كافية: هذا الإجراء مخصص للمدير (ADMIN) فقط',
        },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
}
