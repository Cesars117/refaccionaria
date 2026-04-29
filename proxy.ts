import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { canManageUsers, canViewAudit } from '@/lib/rbac'

function isPublicPath(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/api/auth')
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/usuarios') && !canManageUsers(token.role)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname.startsWith('/auditoria') && !canViewAudit(token.role)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.webp$).*)'],
}
