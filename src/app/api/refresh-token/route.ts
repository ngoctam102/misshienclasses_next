import { NextResponse } from 'next/server';
import { serialize, parse } from 'cookie';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { message: 'No cookie found' },
        { status: 401 }
      );
    } 

    // Dùng cookie parser để lấy token
    const cookies = parse(cookieHeader);
    const token = cookies.token;

    if (!token) {
      return NextResponse.json(
        { message: 'Token not found in cookie' },
        { status: 401 }
      );
    }

    // Gọi đến backend (NestJS) 
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_REFRESH_TOKEN_API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}` // gửi token qua cookie
      }
    });

    if (!backendRes.ok) {
      const text = await backendRes.text();
      console.error('Backend response:', text);
      return NextResponse.json(
        { message: 'Failed to refresh token from backend' },
        { status: backendRes.status }
      );
    }

    const { accessToken } = await backendRes.json();

    if (!accessToken) {
      return NextResponse.json(
        { message: 'No access token received from backend' },
        { status: 500 }
      );
    }

    // Set lại cookie mới
    const serializedCookie = serialize('token', accessToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2, // 2 giờ
    });

    const response = NextResponse.json(
      { message: 'Token refreshed successfully', success: true },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', serializedCookie);
    return response;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
