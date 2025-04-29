'use client';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState, useEffect } from "react";

export default function Navbar() {
    const router = useRouter();
    const [dropdown, setDropdown] = useState<boolean>(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Kiểm tra cookie khi component mount
        const checkLoginStatus = () => {
            const cookies = document.cookie.split(';');
            const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
            console.log('Token cookie:', tokenCookie);
            setIsLoggedIn(!!tokenCookie);
        };
        checkLoginStatus();

        // Thêm event listener để cập nhật trạng thái khi cookie thay đổi
        const handleCookieChange = () => {
            checkLoginStatus();
        };
        window.addEventListener('storage', handleCookieChange);
        return () => window.removeEventListener('storage', handleCookieChange);
    }, []);

    const handleClick = () => {
        setDropdown(!dropdown);
    }

    const handleClickOutSide = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setDropdown(false);
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutSide);
        return () => document.removeEventListener('mousedown', handleClickOutSide);
    }, []);

    const pathname = usePathname();
    const tabs = [
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
                    {tabs.map(tab => {
                        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
                        return (
                            <div key={tab.label}>
                                <Link
                                href={tab.href}
                                className={`text-2xl font-semibold rounded-lg p-3 transition-all duration-300 ease-in-out block hover:bg-orange-500 hover:text-white hover:scale-110 ${isActive ? 'bg-orange-500 text-white' : ''}`}
                                >{tab.label}</Link>
                            </div>
                    )})}
                </div>
                <div>
                    <button className="hover:cursor-pointer" onClick={() => handleClick()}>▼</button>
                    {dropdown && (
                        <div ref={dropdownRef} className="z-10">
                            <ul>
                                {!isLoggedIn ? (
                                    <li><Link href="/signup">Đăng kí</Link></li>
                                ) : (
                                    <li><button className="hover:cursor-pointer" onClick={handleLogout}>Đăng xuất</button></li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}