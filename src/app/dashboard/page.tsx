import { cookies } from "next/headers";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
        console.log('không có token');
        redirect('/login');
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Không có key');
    }
    let payload: JwtPayload;
    try {
        payload = jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
        console.log('Token invalid hoặc hết hạn',error);
        redirect('/login');
    }
    const isAdmin = payload.role === 'admin';
        if (!isAdmin){
            redirect('/unauthorized')
        }
    return (
        <div className="min-h-[calc(100vh-281px)] py-4 lg:py-6 px-2 lg:px-4">
            <Dashboard />
        </div>
    );
}