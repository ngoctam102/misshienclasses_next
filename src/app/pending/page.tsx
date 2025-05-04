'use client';

import Spinner from "@/components/Spinner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function PendingPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

    const checkApprovalStatus = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CHECK_APPROVAL_API_URL}`, {
                method: "GET",
                credentials: 'include'
            });

            if (!response.ok) {
                toast.error('Vui lòng đăng nhập lại 😊😊');
                return router.push('/login');
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                setStatus('approved');
                // Gọi refresh token để lấy token mới có approval = true
                const refreshResponse = await fetch('/api/refresh-token', { 
                    method: 'POST', 
                    credentials: 'include' 
                });
                const dataRefresh = await refreshResponse.json();
                if (dataRefresh.success) {
                    toast.success('Tài khoản đã được phê duyệt.😍😍');
                    router.push('/');
                } else {
                    toast.error('Có lỗi xảy ra, vui lòng thử lại');
                    router.push('/login');
                }
            } else {
                if (data.reason === 'rejected') {
                    setStatus('rejected');
                    toast.error(data.message || 'Tài khoản đã bị từ chối.');
                    await fetch('/api/logout', { 
                        method: 'POST', 
                        credentials: 'include' 
                    });
                    router.push('/login');
                } else {
                    setStatus('pending');
                }
            }
        } catch (error) {
            console.error('Lỗi kiểm tra trạng thái phê duyệt:', error);
            setStatus('rejected');
            toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
        }
    };

    useEffect(() => {
        checkApprovalStatus();
        const interval = setInterval(checkApprovalStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    if (status === 'pending') {
        return (
            <div className="flex flex-wrap items-center justify-center h-[calc(100vh-224px)]">
                <Spinner message="Vui lòng chờ admin phê duyệt 🥰🥰🥰" />
            </div>
        );
    }
    return null;
}
