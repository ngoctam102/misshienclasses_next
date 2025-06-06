'use client';

import Spinner from "@/components/Spinner";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

export default function PendingPage() {
    const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

    const checkApprovalStatus = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CHECK_APPROVAL_API_URL}`, {
                method: "GET",
                credentials: 'include'
            });

            if (!response.ok) {
                toast.error('Vui lòng đăng nhập lại 😊');
                window.location.href = '/login';
                return true;
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
                    window.location.href = '/';
                    // Dừng interval ngay lập tức
                    return true;
                } else {
                    toast.error('Có lỗi xảy ra, vui lòng thử lại');
                    window.location.href = '/login';
                    return true;
                }
            } else {
                if (data.reason === 'rejected') {
                    setStatus('rejected');
                    toast.error(data.message || 'Tài khoản đã bị từ chối.');
                    const res = await fetch('/api/logout', { 
                        method: 'POST', 
                        credentials: 'include' 
                    });
                    const dataLogout = await res.json();
                    if (dataLogout.success) {
                        toast.success('Đăng xuất thành công');
                        window.location.href = '/login';
                        return true;
                    } else {
                        toast.error('Có lỗi xảy ra, vui lòng thử lại');
                        window.location.href = '/login';
                        return true;
                    }
                } else {
                    setStatus('pending');
                }
            }
        } catch (error) {
            console.error('Lỗi kiểm tra trạng thái phê duyệt:', error);
            setStatus('rejected');
            toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
        }
        return false;
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        
        const startChecking = async () => {
            const shouldStop = await checkApprovalStatus();
            if (shouldStop) {
                clearInterval(intervalId);
                return;
            }
            intervalId = setInterval(async () => {
                const shouldStop = await checkApprovalStatus();
                if (shouldStop) {
                    clearInterval(intervalId);
                }
            }, 3000);
        };

        startChecking();
        
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [checkApprovalStatus]);

    if (status === 'pending') {
        return (
            <div className="flex flex-wrap items-center justify-center h-[calc(100vh-224px)]">
                <Spinner message="Vui lòng chờ admin phê duyệt 🥰🥰🥰" />
            </div>
        );
    }
    return null;
}
