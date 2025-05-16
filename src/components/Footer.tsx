import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-white py-8 px-4 shadow-lg">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-gray-800">MissHienClasses</h3>
                        <p className="text-gray-600">Luyện thi IELTS chuyên nghiệp</p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-800">Liên hệ</h4>
                        <div className="space-y-2">
                            <a 
                                href={process.env.FACEBOOK_FANPAGE_URL} 
                                target="_blank" 
                                className="flex items-center text-gray-600 hover:text-orange-500 transition duration-300 ease-in-out hover:scale-110"
                            >
                                <span className="mr-2">📱</span>
                                Fan Page
                            </a>
                            <a 
                                href={process.env.FACEBOOK_URL} 
                                target="_blank" 
                                className="flex items-center text-gray-600 hover:text-orange-500 transition duration-300 ease-in-out hover:scale-110"
                            >
                                <span className="mr-2">👤</span>
                                Facebook
                            </a>
                            <a 
                                href={process.env.ZALO_URL} 
                                target="_blank" 
                                className="flex items-center text-gray-600 hover:text-orange-500 transition duration-300 ease-in-out hover:scale-110"
                            >
                                <span className="mr-2">💬</span>
                                Zalo
                            </a>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-800">Thông tin</h4>
                        <p className="text-gray-600">
                            Chuyên luyện thi IELTS với phương pháp giảng dạy hiệu quả, cam kết đầu ra.
                        </p>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
                    <p>© {new Date().getFullYear()} MissHienClasses. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}