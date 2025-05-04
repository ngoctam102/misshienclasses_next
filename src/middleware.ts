// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_ROUTES = ['/login', '/pending'];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    // Chưa đăng nhập, cho về /login
    if (!AUTH_ROUTES.includes(req.nextUrl.pathname)) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const isApproved = payload.approved === true;
    const isOnPendingPage = req.nextUrl.pathname === '/pending';
    const isAdmin = payload.role === 'admin';
    if (isAdmin) {
      if (req.nextUrl.pathname === '/pending') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return NextResponse.next();
    } else {
      if (!isApproved) {
        // Nếu chưa approved, chỉ cho vào /pending
        if (!isOnPendingPage) {
          const pendingUrl = new URL('/pending', req.url);
          return NextResponse.redirect(pendingUrl);
        }
      } else {
        // Nếu đã approved rồi mà vào /pending thì cho về '/'
        if (isOnPendingPage) {
          const homeUrl = new URL('/', req.url);
          return NextResponse.redirect(homeUrl);
        }
      }
    }
    return NextResponse.next();
  } catch (err) {
    console.error('Middleware error:', err);
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!login|signup|api|_next/static|_next/image|favicon.ico).*)',
  ],
};
