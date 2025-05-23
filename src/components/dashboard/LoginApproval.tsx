'use client';
import { toast } from "react-toastify";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url, {
    credentials: 'include'
}).then(res => res.json());

interface PendingUser {
    _id: string;
    name: string;
    email: string;
}

export default function LoginApproval() {
    const { data, error, mutate } = useSWR(
        `${process.env.NEXT_PUBLIC_PENDING_USER_API_URL}`,
        fetcher
    );

    const handleApprove = async (userId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_APPROVE_USER_API_URL}/${userId}`, {
                method: 'PATCH',
                credentials: 'include'
            });
            
            if (!res.ok) {
                throw new Error('Lỗi khi duyệt người dùng');
            }

            const result = await res.json();
            if (result.success) {
                toast.success('Duyệt người dùng thành công');
                mutate((prevData: { data: PendingUser[] }) => {
                    if (!prevData) return prevData;
                    return prevData.data.filter((user: PendingUser) => user._id !== userId);
                }, false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Approve error:', error);
            toast.error('Có lỗi xảy ra khi duyệt người dùng');
        }
    };

    const handleReject = async (userId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_REJECT_USER_API_URL}/${userId}`, {
                method: 'PATCH',
                credentials: 'include'
            });
            
            if (!res.ok) {
                throw new Error('Lỗi khi từ chối người dùng');
            }

            const result = await res.json();
            if (result.success) {
                toast.success('Từ chối người dùng thành công');
                mutate((prevData: { data: PendingUser[] }) => {
                    if (!prevData) return prevData;
                    return prevData.data.filter((user: PendingUser) => user._id !== userId);
                }, false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Reject error:', error);
            toast.error('Có lỗi xảy ra khi từ chối người dùng');
        }
    };

    if (error) {
        return <div>Lỗi khi tải dữ liệu</div>;
    }
    if (!data) return <div>Đang tải...</div>;

    const pendingUser = data.data || [];

    return (
        <div className="w-full p-2 lg:p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0 mb-4 lg:mb-6">
                <h1 className="font-semibold text-xl lg:text-2xl text-center lg:text-left">Danh sách các học sinh chờ duyệt</h1>
                <button 
                    className="px-3 lg:px-4 py-1.5 lg:py-2 bg-blue-500 text-white rounded-lg font-semibold text-sm lg:text-base transition duration-300 hover:bg-blue-700 hover:cursor-pointer w-full lg:w-auto"
                    onClick={() => mutate()}
                >
                    Làm mới danh sách
                </button>
            </div>
            {pendingUser.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tên
                                </th>
                                <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingUser.map((user: {_id: string, email: string, name: string}) => {
                                const {_id, email, name} = user;
                                return (
                                    <tr key={_id} className="hover:bg-gray-50">
                                        <td className="px-3 lg:px-6 py-2 lg:py-4 whitespace-nowrap text-xs lg:text-sm font-medium text-gray-900">
                                            {name}
                                        </td>
                                        <td className="px-3 lg:px-6 py-2 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                            {email}
                                        </td>
                                        <td className="px-3 lg:px-6 py-2 lg:py-4 whitespace-nowrap text-xs lg:text-sm">
                                            <div className="flex space-x-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleApprove(_id)}
                                                    className="px-2 lg:px-3 py-1 bg-green-500 text-white rounded-md font-medium transition duration-300 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                                                >
                                                    Duyệt
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleReject(_id)}
                                                    className="px-2 lg:px-3 py-1 bg-red-500 text-white rounded-md font-medium transition duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-6 lg:py-10">
                    <p className="text-gray-500 text-sm lg:text-base">Không có người dùng nào đang chờ duyệt</p>
                </div>
            )}
        </div>
    );
}