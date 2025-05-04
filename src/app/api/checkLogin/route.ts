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
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return NextResponse.json({ loggedIn: true, name: payload.name || '', role: payload.role }, { status: 200 });
    } catch (error) {
        console.log('Invalid token', error);
        return NextResponse.json({ loggedIn: false }, { status: 200 });
    }
}