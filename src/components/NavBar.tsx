'use client';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from "react";

export default function Navbar() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [role, setRole] = useState<string>('');

    const checkLoginStatus = async () => {
        try {
            const res = await fetch('/api/checkLogin');
            const data = await res.json();
            setIsLoggedIn(data.loggedIn);
            setName(data.name);
            setRole(data.role);
        } catch (error) {
            console.error('Error checking login status:', error);
            setIsLoggedIn(false);
            setName('');
            setRole('');
        }
    };

    useEffect(() => {
        // Kiểm tra cookie khi component mount
        checkLoginStatus();

        const handleLoginSuccess = () => {
            checkLoginStatus();
        }
        window.addEventListener('login-success', handleLoginSuccess);
        
        return () => {
            window.removeEventListener('login-success', handleLoginSuccess);
        }
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
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setIsLoggedIn(false);
                setName('');
                setRole('');
                router.push('/login');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            // Nếu có lỗi, vẫn reset state và chuyển về login
            setIsLoggedIn(false);
            setName('');
            setRole('');
            router.push('/login');
        }
    }

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link 
                            href='/' 
                            className="text-2xl font-bold text-gray-800 hover:text-orange-500 transition-colors duration-300"
                        >
                            MISSHIENCLASSES
                        </Link>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {isLoggedIn && role === 'admin' ? 
                            adminTabs.map(tab => {
                                const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
                                return (
                                    <Link
                                        key={tab.label}
                                        href={tab.href}
                                        className={`px-3 py-2 rounded-md text-lg font-medium transition-colors duration-300 ${
                                            isActive 
                                                ? 'bg-orange-500 text-white' 
                                                : 'text-gray-600 hover:bg-orange-100 hover:text-orange-500'
                                        }`}
                                    >
                                        {tab.label}
                                    </Link>
                                );
                            }) : 
                            userTabs.map(tab => {
                                const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
                                return (
                                    <Link
                                        key={tab.label}
                                        href={tab.href}
                                        className={`px-3 py-2 rounded-md text-lg font-medium transition-colors duration-300 ${
                                            isActive 
                                                ? 'bg-orange-500 text-white' 
                                                : 'text-gray-600 hover:bg-orange-100 hover:text-orange-500'
                                        }`}
                                    >
                                        {tab.label}
                                    </Link>
                                );
                            })
                        }
                    </div>

                    <div className="flex items-center">
                        {!isLoggedIn ? (
                            <Link 
                                href="/signup" 
                                className="ml-4 px-4 py-2 hover:cursor-pointer rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors duration-300"
                            >
                                Đăng ký
                            </Link>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-600 font-medium">Xin chào, {name}</span>
                                <button 
                                    onClick={handleLogout}
                                    className="px-4 py-2 hover:cursor-pointer rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors duration-300"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}