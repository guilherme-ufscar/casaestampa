import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (pathname.startsWith('/dashboard-admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard-vendedor', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/((?!login|orcamento|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
