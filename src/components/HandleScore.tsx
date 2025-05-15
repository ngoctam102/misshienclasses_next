import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import Spinner from "./Spinner";

interface ErrorWithMessage {
    message: string;
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
    const [userInfo, setUserInfo] = useState<{name: string, role: string, email: string}>({name: '', role: '', email: ''});
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
                if (!res.ok) {
                    throw new Error('Không thể lấy thông tin user');
                }
                const data = await res.json();
                console.log('Thông tin user:', data);
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
            console.log('Kiểm tra điều kiện lưu điểm:', {
                hasName: !!userInfo.name,
                hasRole: !!userInfo.role,
                hasEmail: !!userInfo.email,
                isSaved,
                hasAttemptedSave: hasAttemptedSave.current,
                test_name,
                test_type,
                score,
                duration
            });

            if (!userInfo.name || !userInfo.role || !userInfo.email || isSaved || hasAttemptedSave.current) {
                console.log('Không đủ điều kiện để lưu điểm');
                return;
            }
            
            try {
                hasAttemptedSave.current = true;
                setIsSaving(true);
                setSaveError(null);
                console.log('Đang gọi API lưu điểm...');
                console.log('URL API:', process.env.NEXT_PUBLIC_SAVE_TEST_SCORE_API_URL);
                console.log('Data gửi đi:', {
                    name: userInfo.name,
                    role: userInfo.role,
                    email: userInfo.email,
                    test_name,
                    test_type,
                    score,
                    duration
                });

                const res = await fetch(`${process.env.NEXT_PUBLIC_SAVE_TEST_SCORE_API_URL}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        name: userInfo.name,
                        role: userInfo.role,
                        email: userInfo.email,
                        test_name,
                        test_type,
                        score,
                        duration
                    }),
                });
                console.log('Response status:', res.status);
                const data = await res.json();
                console.log('Response data:', data);

                if (!res.ok) {
                    throw new Error(data.message || 'Không thể lưu điểm');
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