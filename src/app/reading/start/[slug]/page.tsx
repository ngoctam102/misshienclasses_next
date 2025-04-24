import HandleReadingTest from "@/components/HandleReadingTest";
export default async function StartReadingTest({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return (
        <div>
            <HandleReadingTest test_slug={slug} />
        </div>
    )
}