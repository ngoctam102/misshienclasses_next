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
    console.log('Middleware payload:', payload);
    
    const isApproved = payload.approved === true;
    const isOnPendingPage = req.nextUrl.pathname === '/pending';
    const isAdmin = payload.role === 'admin';
    
    console.log('Middleware checks:', {
      isApproved,
      isOnPendingPage,
      isAdmin,
      pathname: req.nextUrl.pathname
    });

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
          console.log('User approved, redirecting to home');
          const homeUrl = new URL('/', req.url);
          return NextResponse.redirect(homeUrl);
        }
      }
    }
    return NextResponse.next();
  } catch (err) {
    console.log('>>>>>>VÀO ĐƯỢC CATCH BLOG>>>>');
    console.error('Middleware error:', err);
    const loginUrl = new URL('/login', req.url);
    
    // Kiểm tra xem lỗi có phải do token hết hạn không
    if (err.code === 'ERR_JWT_EXPIRED') {
      console.log('>>>TOken hết hạn, thực hiện logout.....');
      try {
        console.log('Token expired, calling logout API...');
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
        } else {
          console.log('Logout API call successfully');
        }
        
        // Xóa cookie token ở client
        const response = NextResponse.redirect(loginUrl);
        response.cookies.set('token', '', { path: '/', expires: new Date(0) });
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
    '/((?!login|signup|api|_next/static|_next/image|favicon.ico).*)',
  ],
};
