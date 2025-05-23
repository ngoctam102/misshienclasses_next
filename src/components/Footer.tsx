export default function Footer() {
    return (
        <footer className="bg-white py-3 lg:py-4 px-2 lg:px-4 shadow-lg">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
                    <div className="space-y-1 lg:space-y-2">
                        <h3 className="text-lg lg:text-xl font-bold text-gray-800">MissHienClasses</h3>
                        <p className="text-sm lg:text-base text-gray-600">Luyện thi IELTS chuyên nghiệp</p>
                    </div>
                    <div className="space-y-1 lg:space-y-2">
                        <h4 className="text-sm lg:text-base font-semibold text-gray-800">Liên hệ</h4>
                        <div className="space-y-1">
                            <a 
                                href={process.env.FACEBOOK_FANPAGE_URL} 
                                target="_blank" 
                                className="flex items-center text-sm lg:text-base text-gray-600 hover:text-orange-500 transition duration-300 ease-in-out hover:scale-110"
                            >
                                <span className="mr-2">📱</span>
                                Fan Page
                            </a>
                            <a 
                                href={process.env.FACEBOOK_URL} 
                                target="_blank" 
                                className="flex items-center text-sm lg:text-base text-gray-600 hover:text-orange-500 transition duration-300 ease-in-out hover:scale-110"
                            >
                                <span className="mr-2">👤</span>
                                Facebook
                            </a>
                            <a 
                                href={process.env.ZALO_URL} 
                                target="_blank" 
                                className="flex items-center text-sm lg:text-base text-gray-600 hover:text-orange-500 transition duration-300 ease-in-out hover:scale-110"
                            >
                                <span className="mr-2">💬</span>
                                Zalo
                            </a>
                        </div>
                    </div>
                    <div className="space-y-1 lg:space-y-2">
                        <h4 className="text-sm lg:text-base font-semibold text-gray-800">Thông tin</h4>
                        <p className="text-xs lg:text-sm text-gray-600">
                            Chuyên luyện thi IELTS với phương pháp giảng dạy hiệu quả, cam kết đầu ra.
                        </p>
                    </div>
                </div>
                <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-gray-200 text-center text-gray-600">
                    <p className="text-xs lg:text-sm">
                        <span className="font-medium">Địa chỉ:</span> 42, Đường 30/4, Phường Trung Dũng,<br />
                        Thành phố Biên Hòa, Tỉnh Đồng Nai
                    </p>
                </div>
            </div>
        </footer>
    );
}