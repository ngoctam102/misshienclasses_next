'use client';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from "react";

export default function Navbar() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [role, setRole] = useState<string>('');
    useEffect(() => {
        // Kiểm tra cookie khi component mount
        const checkLoginStatus = async () => {
            const res = await fetch('/api/checkLogin');
            const data = await res.json();
            setIsLoggedIn(data.loggedIn);
            setName(data.name);
            setRole(data.role);
        };
        checkLoginStatus();
        const handleLoginSuccess = () => {
            checkLoginStatus();
        }
        window.addEventListener('login-success', handleLoginSuccess);
        return () => window.removeEventListener('login-success', handleLoginSuccess);
    }, []);

    const pathname = usePathname();
    const userTabs = [
        {
            href: '/',
            label: 'Home'
        },
        {
            href: '/reading',
            label: 'Reading'
        },
        {
            href: '/listening',
            label: 'Listening'
        }
    ];
    const adminTabs = [
        {
            href: '/',
            label: 'Home'
        },
        {
            href: '/reading',
            label: 'Reading'
        },
        {
            href: '/listening',
            label: 'Listening'
        },
        {
            href: '/dashboard',
            label: 'Dashboard'
        }
    ];

    const handleLogout = async () => {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            setIsLoggedIn(false);
            router.push('/login');
        }
    }

    return (
        <nav className="bg-white shadow-2xl">
            <div className="container mx-auto p-4 flex items-center justify-between">
                <Link href='/' className="text-3xl font-bold hover:text-orange-500 hover:scale-110 transition-all duration-300 ease-in-out">MISSHIENCLASSES</Link>
                <div className="flex gap-20">
                    {isLoggedIn && role === 'admin' ? 
                        adminTabs.map(tab => {
                            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
                            return (
                                <div key={tab.label}>
                                    <Link
                                    href={tab.href}
                                    className={`text-2xl font-semibold rounded-lg p-3 transition-all duration-300 ease-in-out block hover:bg-orange-500 hover:text-white hover:scale-110 ${isActive ? 'bg-orange-500 text-white' : ''}`}
                                    >{tab.label}</Link>
                                </div>
                        )}) : 
                        userTabs.map(tab => {
                            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
                            return (
                                <div key={tab.label}>
                                    <Link
                                    href={tab.href}
                                    className={`text-2xl font-semibold rounded-lg p-3 transition-all duration-300 ease-in-out block hover:bg-orange-500 hover:text-white hover:scale-110 ${isActive ? 'bg-orange-500 text-white' : ''}`}
                                    >{tab.label}</Link>
                                </div>
                        )})
                    }
                </div>
                <div>
                    {!isLoggedIn ? (
                        <Link href="/signup" className="hover:cursor-pointer text-md font-semibold rounded-lg p-2 transition-all duration-300 ease-in-out block bg-blue-500 hover:bg-orange-500 hover:text-white hover:scale-110">Đăng kí</Link>
                    ) : (
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-xl">Hi, {name}</p>
                            <button className="hover:cursor-pointer text-md font-semibold rounded-lg p-2 transition-all duration-300 ease-in-out block bg-red-400 hover:bg-red-800 hover:text-white hover:scale-110" onClick={handleLogout}>Đăng xuất</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}