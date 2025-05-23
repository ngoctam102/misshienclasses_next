import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import Spinner from "./Spinner";

interface ErrorWithMessage {
    message: string;
}

interface UserInfo {
    loggedIn: boolean;
    user?: {
        sub: string;
        name: string;
        role: string;
        email: string;
        approved: boolean;
        iat: number;
        exp: number;
    };
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
    );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
    if (isErrorWithMessage(maybeError)) return maybeError;
    try {
        return new Error(JSON.stringify(maybeError));
    } catch {
        return new Error(String(maybeError));
    }
}

export default function HandleScore({test_name, test_type, score, duration}: {
    test_name: string,
    test_type: string,
    score: number,
    duration: number
}) {
    const [userInfo, setUserInfo] = useState<UserInfo>({ loggedIn: false });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const hasAttemptedSave = useRef(false);

    // Lấy thông tin user
    useEffect(() => {
        const checkUserInfo = async () => {
            try {
                setIsLoading(true);
                console.log('Đang gọi API checkLogin...');
                const res = await fetch('/api/checkLogin');
                const data = await res.json();
                console.log('Thông tin user từ API checkLogin:', data);
                setUserInfo(data);
            } catch (error: unknown) {
                const errorWithMessage = toErrorWithMessage(error);
                toast.error('Không thể lấy thông tin user');
                console.error('Lỗi khi lấy thông tin user:', errorWithMessage.message);
            } finally {
                setIsLoading(false);
            }
        };
        checkUserInfo();
    }, []);

    // Lưu điểm
    useEffect(() => {
        const saveScore = async () => {
            console.log('=== BẮT ĐẦU QUÁ TRÌNH LƯU ĐIỂM ===');
            console.log('Trạng thái userInfo hiện tại:', userInfo);
            
            if (!userInfo.loggedIn) {
                console.log('User chưa đăng nhập');
                return;
            }

            if (!userInfo.user) {
                console.log('Không có thông tin user');
                return;
            }

            const { name, role, email } = userInfo.user;
            console.log('Thông tin user cần thiết:', { name, role, email });

            if (!name || !role || !email) {
                console.log('Thiếu thông tin user cần thiết:', {
                    hasName: !!name,
                    hasRole: !!role,
                    hasEmail: !!email
                });
                return;
            }

            if (isSaved || hasAttemptedSave.current) {
                console.log('Điểm đã được lưu hoặc đang trong quá trình lưu');
                return;
            }
            
            try {
                hasAttemptedSave.current = true;
                setIsSaving(true);
                setSaveError(null);

                const apiUrl = process.env.NEXT_PUBLIC_SAVE_TEST_SCORE_API_URL;
                console.log('URL API lưu điểm:', apiUrl);
                
                if (!apiUrl) {
                    throw new Error('Không tìm thấy URL API lưu điểm. Vui lòng kiểm tra biến môi trường NEXT_PUBLIC_SAVE_TEST_SCORE_API_URL');
                }

                const requestBody = {
                    name,
                    role,
                    email,
                    test_name,
                    test_type,
                    score,
                    duration
                };

                console.log('Data gửi đi:', requestBody);

                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(requestBody),
                });

                console.log('Response status:', res.status);
                const data = await res.json();
                console.log('Response data:', data);

                if (!res.ok) {
                    throw new Error(data.message || `Lỗi HTTP: ${res.status}`);
                }
                if (!data.success) {
                    throw new Error(data.message || 'Lưu điểm không thành công');
                }
                setIsSaved(true);
                toast.success('Lưu điểm thành công');
            } catch (error: unknown) {
                const errorWithMessage = toErrorWithMessage(error);
                setSaveError(errorWithMessage.message);
                toast.error('Không thể lưu điểm: ' + errorWithMessage.message);
                console.error('Lỗi khi lưu điểm:', errorWithMessage.message);
            } finally {
                setIsSaving(false);
                console.log('=== KẾT THÚC QUÁ TRÌNH LƯU ĐIỂM ===');
            }
        };
        saveScore();
    }, [userInfo, test_name, test_type, score, duration, isSaved]);

    return (
        <>
            {isLoading ? (
                <Spinner />
            ) : isSaving ? (
                <div>Đang lưu điểm...</div>
            ) : saveError ? (
                <div className="text-red-500">Lỗi: {saveError}</div>
            ) : (
                <div>
                    {isSaved && <p className="text-green-500">Điểm đã được lưu thành công!</p>}
                </div>
            )}
        </>
    );
}