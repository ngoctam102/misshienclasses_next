import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const url = new URL(request.url);
    console.log('>>>Full URL:', url.toString());
    console.log('>>>All search params:', Object.fromEntries(url.searchParams));
    const tokenExpired = url.searchParams.get('token-expired');
    console.log('>>>dữ liệu trả về từ api checkTokenExpired:', tokenExpired);
    const isExpired = tokenExpired === 'true';
    return NextResponse.json({ expired: isExpired });
}