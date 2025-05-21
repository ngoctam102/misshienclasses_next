import { NextResponse } from 'next/server';
import { parse } from 'cookie';
import { jwtVerify } from 'jose';

export async function GET(request: Request) {
    const cookieHeader = request.headers.get('cookie');
    
    if (!cookieHeader) {
        return NextResponse.json({ loggedIn: false }, { status: 200 });
    }
    
    const cookies = parse(cookieHeader);
    const token = cookies.token;
    
    if (!token) {
        return NextResponse.json({ loggedIn: false }, { status: 200 });
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        // Kiểm tra thời gian hết hạn
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return NextResponse.json({ loggedIn: false }, { 
                status: 401,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }
        return NextResponse.json({ loggedIn: true, user: payload }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch {
        return NextResponse.json({ loggedIn: false }, { 
            status: 401,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    }
}