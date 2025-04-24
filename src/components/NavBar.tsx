'use client';
import Link from "next/link";
import { usePathname } from 'next/navigation'
export default function Navbar() {
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
    return (
        <nav className="px-50 p-6 flex items-center justify-between bg-white shadow-lg">
            <Link href='/' className="text-3xl font-bold hover:text-orange-500 hover:scale-110 transition-all duration-300 ease-in-out">MISSHIENCLASSES</Link>
            <div className="flex gap-20">
                {tabs.map(tab => {
                    /* tab sẽ được active nếu nếu là home và pathname hiện tại cũng là home
                    nếu không thì tab sẽ được tính là active nếu nó có pathname bắt đầu bằng tab.href 
                    */
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
        </nav>
    );
}