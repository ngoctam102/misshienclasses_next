import { NextResponse } from 'next/server';
import { serialize } from 'cookie'; // hàm tạo chuỗi cookie đúng định dạng

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: 'Missing token' },
        { status: 400 }
      );
    }

    const serializedCookie = serialize('token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', // chỉ gửi cookie qua HTTPS trong môi trường production
      maxAge: 60 * 60 * 2, // 2 giờ
    });

    const response = NextResponse.json(
      { message: 'Cookie set successfully' },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', serializedCookie);
    return response;
  } catch (error) {
    console.error('Error setting cookie:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
