'use client'
import Link from "next/link";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import Script from 'next/script';

declare global {
    interface Window {
        grecaptcha: {
            render: (container: string, options: {
                sitekey: string;
                callback: (token: string) => void;
            }) => void;
        };
    }
}

export default function SignUpPage() {
    const [recaptchaToken, setRecaptchaToken] = useState<string>("");
    const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

    useEffect(() => {
        if (isRecaptchaReady && typeof window !== 'undefined' && window.grecaptcha) {
            window.grecaptcha.render('recaptcha-container', {
                'sitekey': process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
                'callback': (token: string) => {
                    setRecaptchaToken(token);
                }
            });
        }
    }, [isRecaptchaReady]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!recaptchaToken) {
            toast.error("Vui lòng xác nhận reCAPTCHA");
            return;
        }

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
            recaptchaToken
        };
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SIGNUP_API_URL}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (responseData.success) {
                toast.success("Đăng kí tài khoản thành công!");
            } else {
                toast.error(responseData.message);  
            }
        } catch (error) {
            console.log('Lỗi fetch để tạo mới user: ',error);
            toast.error("Có lỗi xảy ra khi kết nối server!");
        }
    }

    return (
        <div className="flex items-center justify-center h-[calc(100vh-349px)]">
            <Script
                src="https://www.google.com/recaptcha/api.js"
                onLoad={() => setIsRecaptchaReady(true)}
            />
            <form onSubmit={handleSubmit} className="p-8 w-[400px] bg-white shadow-lg rounded-lg">
                <div className="flex flex-col space-y-4">
                    <h1 className="font-bold text-2xl text-center mb-5">Đăng kí</h1>
                    <label htmlFor="name" className="font-medium text-sm mb-1 text-gray-700">Tên</label>
                    <input id="name" name="name" type="text" className="w-full py-2 px-4 border-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Nhập tên của bạn" />
                    <label htmlFor="email" className="font-medium text-sm mb-1 text-gray-700">Email</label>
                    <input id="email" type="email" name="email" className="w-full py-2 px-4 border-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Nhập email của bạn" />
                    <label htmlFor="password" className="font-medium text-sm mb-1 text-gray-700">Mật khẩu</label>
                    <input id="password" type="password" name="password" className="w-full py-2 px-4 border-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Nhập mật khẩu" />
                    <div id="recaptcha-container" className="flex justify-center my-4"></div>
                    <button type="submit" className="bg-blue-500 p-3 rounded-lg mt-3 text-white font-bold hover:bg-blue-700 hover:scale-105 transition duration-300 hover:cursor-pointer">Đăng kí</button>
                </div>
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">Đã có tài khoản?{' '}
                        <Link href="/login" className="text-blue-500 hover:text-blue-700 hover:scale-105 inline-block transition duration-300">Đăng nhập</Link>
                    </p>
                </div>
            </form>
        </div>
    );
}