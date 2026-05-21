import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get('authjs.session-token') ??
    req.cookies.get('__Secure-authjs.session-token')

  const isAuth = !!token
  const { pathname } = req.nextUrl
  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (!isAuth && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|icon).*)',
  ],
}
