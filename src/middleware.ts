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
      loginUrl.searchParams.set('message', 'Vui lòng đăng nhập để tiếp tục');
      const response = NextResponse.redirect(loginUrl);
      return response;
    }
    return NextResponse.next();
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const isApproved = payload.approved === true;
    const isOnPendingPage = req.nextUrl.pathname === '/pending';
    const isAdmin = payload.role === 'admin';
    
    // Nếu là admin, cho phép truy cập tất cả các trang trừ /pending
    if (isAdmin) {
      if (isOnPendingPage) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return NextResponse.next();
    }

    // Nếu không phải admin
    if (!isApproved) {
      // Nếu chưa approved và không ở trang pending, chuyển về pending
      if (!isOnPendingPage) {
        return NextResponse.redirect(new URL('/pending', req.url));
      }
    } else if (isOnPendingPage) {
      // Nếu đã approved và đang ở trang pending, chuyển về trang chủ
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error('Middleware error:', err);
    const loginUrl = new URL('/login', req.url);
    
    // Kiểm tra xem lỗi có phải do token hết hạn không
    if (err instanceof Error && 'code' in err && err.code === 'ERR_JWT_EXPIRED') {
      try {
        // Gọi API logout để reset trạng thái user
        const res = await fetch(`${process.env.NEXT_PUBLIC_LOGOUT_API_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cookie': `token=${token}`
          }
        });
        
        if (!res.ok) {
          console.error('Logout API call failed:', await res.text());
        }
        
        // Xóa cookie token ở client
        const response = NextResponse.redirect(loginUrl);
        response.cookies.set('token', '', { 
          path: '/', 
          expires: new Date(0),
          domain: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_DOMAIN : undefined,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        loginUrl.searchParams.set('message', 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại');
        return response;
      } catch (logoutError) {
        console.error('Error during logout:', logoutError);
        loginUrl.searchParams.set('message', 'Có lỗi xảy ra khi đăng xuất, vui lòng thử lại');
      }
    } else {
      loginUrl.searchParams.set('message', 'Phiên làm việc không hợp lệ, vui lòng đăng nhập lại');
    }
    
    const response = NextResponse.redirect(loginUrl);
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!login|signup|api|_next/static|_next/image|favicon.ico|apple-touch-icon.png|favicon-32x32.png|favicon-16x16.png|android-chrome-192x192.png|android-chrome-512x512.png|site.webmanifest).*)',
  ],
};
