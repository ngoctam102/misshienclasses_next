// app/admin/tests/new/page.tsx
'use client';

import TestForm from '@/components/TestForm';

export default function CreateTestPage() {
  const handleSubmit = (data: any) => {
    console.log('Test info:', data);
    // TODO: Chuyển sang bước tạo passage
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-xl font-bold mb-6">Tạo đề thi mới</h1>
      <TestForm onSubmit={handleSubmit} />
    </div>
  );
}
