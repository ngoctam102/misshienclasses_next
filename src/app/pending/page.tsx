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
                console.error('Lỗi HTTP:', response.status);
                toast.error('Có lỗi xảy ra');
                setStatus('rejected');
                return;
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

                if (refreshResponse.ok) {
                    toast.success(data.message || 'Tài khoản đã được phê duyệt.');
                    router.push('/');
                } else {
                    toast.error('Có lỗi xảy ra khi cập nhật token.');
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
        const interval = setInterval(checkApprovalStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    if (status === 'pending') {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner message="Đang kiểm tra trạng thái phê duyệt..." />
            </div>
        );
    }

    return null;
}
