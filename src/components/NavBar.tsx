'use client';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

export default function Navbar() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [role, setRole] = useState<string>('');
    const pathname = usePathname();

    const checkLoginStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/checkLogin', {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store'
            });
            const data = await res.json();
            
            if (!data.loggedIn) {
                setIsLoggedIn(false);
                setName('');
                setRole('');
                // Nếu đang ở trang cần xác thực và chưa login, chuyển về trang login
                if (!pathname.includes('/login') && !pathname.includes('/signup')) {
                    router.push('/login');
                }
                return;
            }
            
            setIsLoggedIn(data.loggedIn);
            setName(data.user.name || '');
            setRole(data.user.role || '');
        } catch (error) {
            console.error('Error checking login status:', error);
            setIsLoggedIn(false);
            setName('');
            setRole('');
            if (!pathname.includes('/login') && !pathname.includes('/signup')) {
                router.push('/login');
            }
        }
    }, [pathname, router]);

    useEffect(() => {
        checkLoginStatus();
    }, [checkLoginStatus]);

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
            await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store'
            });
            
            // Reset state ngay lập tức
            setIsLoggedIn(false);
            setName('');
            setRole('');
            
            // Chuyển hướng về trang login
            router.push('/login');
            
            // Force reload trang để đảm bảo state được cập nhật
            window.location.reload();
        } catch (error) {
            console.error('Error during logout:', error);
            setIsLoggedIn(false);
            setName('');
            setRole('');
            router.push('/login');
            window.location.reload();
        }
    }

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
                <div className="flex justify-between h-14 lg:h-16">
                    <div className="flex items-center">
                        <Link 
                            href='/' 
                            className="flex items-center justify-center text-lg lg:text-2xl font-bold text-gray-800"
                        >
                            <Image src="/android-chrome-192x192.png"
                            alt="logo"
                            width={40}
                            height={40}
                            className="mr-2 hover:scale-110 transition duration-300 ease-in-out"
                            />
                            <p className="hover:scale-105 hover:text-orange-500 transition duration-300 ease-in-out">MissHienClasses</p>
                        </Link>
                    </div>
                    
                    <div className="flex items-center space-x-1 lg:space-x-4">
                        {isLoggedIn && role === 'admin' ? 
                            adminTabs.map(tab => {
                                const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
                                return (
                                    <Link
                                        key={tab.label}
                                        href={tab.href}
                                        className={`px-2 lg:px-3 py-1 lg:py-2 rounded-md text-sm lg:text-lg font-medium transition-all duration-300 ease-in-out ${
                                            isActive 
                                                ? 'bg-orange-500 text-white' 
                                                : 'text-gray-600 hover:bg-orange-500 hover:text-white hover:scale-110'
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
                                        className={`px-2 lg:px-3 py-1 lg:py-2 rounded-md text-sm lg:text-lg font-medium transition-all duration-300 ease-in-out ${
                                            isActive 
                                                ? 'bg-orange-500 text-white' 
                                                : 'text-gray-600 hover:bg-orange-500 hover:text-white hover:scale-110'
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
                                className="ml-2 lg:ml-4 px-2 lg:px-4 py-1 lg:py-2 hover:cursor-pointer rounded-md text-xs lg:text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 hover:scale-110 transition duration-300 ease-in-out"
                            >
                                Đăng ký
                            </Link>
                        ) : (
                            <div className="flex items-center space-x-2 lg:space-x-4">
                                <span className="text-xs lg:text-sm text-gray-600 font-medium">Xin chào, {name}</span>
                                <button 
                                    onClick={handleLogout}
                                    className="px-2 lg:px-4 py-1 lg:py-2 hover:cursor-pointer rounded-md text-xs lg:text-sm font-medium text-white bg-red-500 hover:bg-red-600 hover:scale-110 transition duration-300 ease-in-out"
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