import { Test } from '@/types/test';
import Link from 'next/link';

export default function ListeningTests({ tests }: { tests: Test[] }) {
    return (
        <div className="space-y-4 container mx-auto grid grid-cols-3 grid-rows-4 gap-4">
            {tests.map((test) => (
                <div key={test.test_slug} className="p-4 border rounded-lg h-full flex flex-col justify-between bg-orange-200">
                    <div>
                        <h1 className="text-xl font-bold">{test.title}</h1>
                        <p className="text-gray-600">Level: {test.level}</p>
                        <p className="text-gray-600">Duration: {test.duration} minutes</p>
                    </div>
                    <Link 
                        href={`/reading/start/${test.test_slug}`} 
                        className="bg-blue-500 text-white px-4 py-2 rounded-md max-w-fit hover:bg-blue-600 transition-all hover:scale-110"
                    >
                        Start test
                    </Link>
                </div>
            ))}
        </div>
    );
}