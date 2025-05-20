import { NextResponse } from 'next/server';
import { parse } from 'cookie';
import { jwtVerify } from 'jose';

export async function GET(request: Request) {
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header:', cookieHeader);
    
    if (!cookieHeader) {
        console.log('No cookie header found');
        return NextResponse.json({ loggedIn: false }, { status: 200 });
    }
    
    const cookies = parse(cookieHeader);
    const token = cookies.token;
    console.log('Token from cookie:', token ? 'exists' : 'not found');
    
    if (!token) {
        console.log('No token found in cookies');
        return NextResponse.json({ loggedIn: false }, { status: 200 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        console.log('JWT payload:', payload);
        
        return NextResponse.json({ 
            loggedIn: true, 
            name: payload.name || '', 
            role: payload.role, 
            email: payload.email 
        }, { status: 200 });
    } catch (error) {
        console.log('Invalid token', error);
        return NextResponse.json({ loggedIn: false }, { status: 200 });
    }
}