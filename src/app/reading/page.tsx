'use client';
import ReadingTests from '@/components/ReadingTests';
import useSWR from 'swr';

export default function ReadingPage() {
    const fetcher = (url: string) => fetch(url).then(res => res.json());
    const { data, isLoading, error } = useSWR(
        process.env.NEXT_PUBLIC_READING_API_URL,
        fetcher,
        {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 p-4">Error: {error.message}</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-gray-500 p-4">No data available</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-4 text-center">Reading Tests</h1>
            <ReadingTests tests={data} />
        </div>
    );
}

