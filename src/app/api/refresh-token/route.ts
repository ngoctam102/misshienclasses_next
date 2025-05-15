import { NextResponse } from 'next/server';
import { parse } from 'cookie';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie from request:', cookieHeader);

    if (!cookieHeader) {
      return NextResponse.json(
        { message: 'No cookie found' },
        { status: 401 }
      );
    }

    const cookies = parse(cookieHeader);
    const token = cookies.token;

    if (!token) {
      return NextResponse.json(
        { message: 'Token not found in cookie' },
        { status: 401 }
      );
    }

    console.log('Calling backend URL:', process.env.NEXT_PUBLIC_REFRESH_TOKEN_API_URL);

    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_REFRESH_TOKEN_API_URL}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Cookie': `token=${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    console.log('Backend response status:', backendRes.status);
    console.log('Backend response headers:', Object.fromEntries(backendRes.headers.entries()));

    const responseText = await backendRes.text();
    console.log('Backend response text:', responseText);

    if (!backendRes.ok) {
      return NextResponse.json(
        { 
          message: 'Failed to refresh token from backend',
          details: responseText,
          status: backendRes.status
        },
        { status: backendRes.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      return NextResponse.json(
        { message: 'Invalid response from backend', success: false },
        { status: 500 }
      );
    }

    if (data.success) {
      const setCookieHeader = backendRes.headers.get('set-cookie');
      
      const response = NextResponse.json(
        { message: 'Token refreshed successfully', success: true },
        { status: 200 }
      );

      if (setCookieHeader) {
        response.headers.set('Set-Cookie', setCookieHeader);
      }

      return response;
    } else {
      return NextResponse.json(
        { 
          message: 'Token refresh failed',
          details: data.message || 'Unknown error',
          success: false 
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error in refresh token route:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}
