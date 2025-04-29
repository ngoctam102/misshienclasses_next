import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  const expiredCookie = serialize('token', '', {
    path: '/',
    maxAge: -1,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  const response = NextResponse.json({ success: true, message: 'Đăng xuất thành công' });
  response.headers.set('Set-Cookie', expiredCookie);

  return response;
}
