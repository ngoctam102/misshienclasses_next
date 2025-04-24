'use client';
import Spinner from "@/components/Spinner";
import useSWR from "swr";
import ListeningTests from "@/components/ListeningTests";

export default function ListeningPage() {
    const fetcher = (url: string) => fetch(url).then(res => res.json());
    const { data, isLoading, error } = useSWR(
        process.env.NEXT_PUBLIC_LISTENING_API_URL,
        fetcher,
        {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );
    if (isLoading){
        return (
            <Spinner />
        );
    }
    if (!data){
        return (
            <div className="grid place-items-center text-3xl font-bold">Data not found</div>
        );
    }
    if (error) {
        return (
            <div className="grid place-items-center text-3xl font-bold">Error: {error.message}</div>
        );
    }
    return (
       <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-4 text-center">Listening Tests</h1>
            <ListeningTests tests={data} />
        </div>
    );
}
