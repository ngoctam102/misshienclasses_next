'use client';
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Script from 'next/script';

declare global {
    interface Window {
        grecaptcha: {
            render: (container: string, options: {
                sitekey: string;
                callback: (token: string) => void;
                size: string;
                badge: string;
            }) => number;
            execute: (widgetId: number) => void;
            ready: (callback: () => void) => void;
        };
    }
}

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [recaptchaToken, setRecaptchaToken] = useState<string>("");
    const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

    useEffect(() => {
        const message = searchParams.get('message');
        if (message) {
            toast.info(message);
        }
    }, [searchParams]);

    useEffect(() => {
        if (isRecaptchaReady && typeof window !== 'undefined' && window.grecaptcha) {
            window.grecaptcha.render('recaptcha-container', {
                'sitekey': process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
                'callback': (token: string) => {
                    setRecaptchaToken(token);
                },
                'size': 'normal',
                'badge': 'bottomright'
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
            email: formData.get('email'),
            password: formData.get('password'),
            recaptchaToken
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_LOGIN_API_URL}`, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (responseData.success) {
                toast.success('Login thành công, vui lòng chờ được admin phê duyệt!');
                window.dispatchEvent(new Event('login-success'));
                router.push('/pending');
            } else {
                toast.error(responseData.message);
                setRecaptchaToken("");
            }
        } catch (error) {
            console.log('Lỗi gửi fetch: ',error);
            toast.error('Có lỗi kết nối xảy ra');
            setRecaptchaToken("");
        }
    };

    return (
        <div className="flex items-center justify-center h-[calc(100vh-349px)]">
            <Script
                src="https://www.google.com/recaptcha/api.js"
                onLoad={() => setIsRecaptchaReady(true)}
            />
            <form className="w-[400px] p-8 bg-white rounded-xl shadow-lg" onSubmit={handleSubmit}>
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Đăng nhập</h1>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            id="email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Nhập email của bạn"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Mật khẩu
                        </label>
                        <input
                            name="password"
                            type="password"
                            id="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Nhập mật khẩu"
                        />
                    </div>

                    <div id="recaptcha-container" className="flex justify-center my-4"></div>

                    <button
                        type="submit"
                        className="w-full mt-3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all duration-300 text-white font-medium rounded-lg hover:cursor-pointer"
                    >
                        Đăng nhập
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        Chưa có tài khoản?{'   '}
                        <Link href="/signup" className="text-blue-600 hover:text-blue-700 hover:scale-105 inline-block transition duration-300">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
}