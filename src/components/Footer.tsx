import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-white p-5 h-full px-50 shadow-lg">
            <div className="flex items-center justify-between h-full">
                <span className="flex flex-col justify-between gap-5">
                    MissHienClasses
                    <span>
                        Luyện thi IELTS
                    </span>
                </span>
                <div className="flex flex-col gap-3">
                    <a href={process.env.FACEBOOK_FANPAGE_URL} target="_blank" className="hover:text-orange-500 transition-color duration-300">Fan Page</a>
                    <a href={process.env.FACEBOOK_URL} target="_blank" className="hover:text-orange-500 transition-color duration-300">Facebook</a>
                    <a href={process.env.ZALO_URL} target="_blank" className="hover:text-orange-500 transition-color duration-300">Zalo</a>
                </div>
            </div>
        </footer>
    );
}