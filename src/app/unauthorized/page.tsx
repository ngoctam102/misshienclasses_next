import Link from "next/link";

export default function Unauthorized() {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-224px)] font-semibold text-xl gap-4">
            <h1>Bạn không có quyền truy cập 😥😥😥</h1>
            <Link className="underline text-red-500 hover:text-red-700 transition duration-300 hover:scale-105" href="/">Quay lại trang chủ</Link>
        </div>
    );
}