'use client';
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function LoginApproval() {
    const [pendingUser, setPendingUser] = useState([]);
    const fetchData = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PENDING_USER_API_URL}`, {
                credentials: 'include'
            });
            if (!res.ok) {
                return console.log('Lỗi khi gọi fetch LoginApproval:', res.status);
            }
            const data = await res.json();
            if (data.success) {
                setPendingUser(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log('Lỗi fetch từ LoginApproval:',error);
        }
    }
    useEffect(() => {
        fetchData();
    },[])
    
    return (
        <div className="w-full p-10">
            <div className="flex items-center justify-between">
                <h1 className="font-semibold text-3xl">Danh sách các học sinh chờ duyệt</h1>
                <button 
                className="p-4 bg-blue-500 rounded-lg font-semibold text-lg transition duration-300 hover:text-white hover:bg-blue-700 hover:cursor-pointer"
                onClick={() => fetchData()}>Làm mới danh sách</button>
            </div>
            {pendingUser.length > 0 ? (
                pendingUser.map(user => {
                    const {_id, email, name} = user;
                    return (
                        <div key={_id}>
                            {name} - {email}
                        </div>
                    );
                })
            ) : (
                <p>Không có người dùng nào đang chờ duyệt</p>
            )}
        </div>
    );
}