'use client';

import { useForm } from 'react-hook-form';

interface TestFormData {
  test_code: string;
  type: 'reading' | 'listening';
  level: 'academic' | 'general';
  title: string;
  duration: number;
}

export default function TestForm({ onSubmit }: { onSubmit: (data: TestFormData) => void }) {
  const { register, handleSubmit } = useForm<TestFormData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block">Test Code</label>
        <input {...register('test_code')} className="input" />
      </div>
      <div>
        <label className="block">Type</label>
        <select {...register('type')} className="input">
          <option value="reading">Reading</option>
          <option value="listening">Listening</option>
        </select>
      </div>
      <div>
        <label className="block">Level</label>
        <select {...register('level')} className="input">
          <option value="academic">Academic</option>
          <option value="general">General</option>
        </select>
      </div>
      <div>
        <label className="block">Title</label>
        <input {...register('title')} className="input" />
      </div>
      <div>
        <label className="block">Duration (minutes)</label>
        <input type="number" {...register('duration')} className="input" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Save & Continue
      </button>
    </form>
  );
}
