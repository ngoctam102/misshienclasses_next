import { NextResponse } from 'next/server';
import { serialize, parse } from 'cookie';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    // if (!cookieHeader) {
    //   return NextResponse.json(
    //     { message: 'No cookie found' },
    //     { status: 401 }
    //   );
    // }
    
    // Dùng cookie parser để lấy token
    const cookies = parse(cookieHeader || '');
    const token = cookies.token;

    // if (!token) {
    //   return NextResponse.json(
    //     { message: 'Token not found in cookie' },
    //     { status: 401 }
    //   );
    // }
    const res = await fetch(`${process.env.NEXT_PUBLIC_LOGOUT_API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token || ''}`
      }
    });
    const data = await res.json();
    if (!data.success) {
      console.warn('Backend logout failed, nhưng vẫn xoá token ở client');
    }
    // Luôn xóa cookie token bất kể response từ backend
    const expiredCookie = serialize('token', '', {
      path: '/',
      maxAge: -1,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_DOMAIN : undefined
    });
    const response = NextResponse.json({ success: true, message: 'Đăng xuất thành công' });
    response.headers.set('Set-Cookie', expiredCookie);
    return response;
    
  } catch (error) {
    console.log('Lỗi khi gọi fetch để logout user', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
