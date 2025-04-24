import HandleListeningTest from "@/components/HandleListeningTest";
export default async function StartListeningTest({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return (
        <div>
            <HandleListeningTest test_slug={slug}/>
        </div>
    );
}