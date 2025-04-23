import Link from "next/link";
export default function Navbar() {
    return (
        <nav className="px-50 py-6 flex items-center justify-between bg-white shadow-md">
            <Link href="/" className="text-3xl font-bold hover:text-orange-500">MISSHIENCLASSES</Link>
            <div className="flex gap-6">
                <Link href="/reading" className="hover:text-orange-500 text-2xl">Reading</Link>
                <Link href="/listening" className="hover:text-orange-500 text-2xl">Listening</Link>
            </div>
        </nav>
    );
}