'use client';
import React, { useState, useEffect } from 'react';
import { Test, Passage, QuestionGroup, Question, TestType, TestLevel, QuestionType, ContentType } from '@/types/test';
import Image from 'next/image';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';

// Component RichTextEditor
const RichTextEditor = ({ content, onChange }: { content: string, onChange: (value: string) => void }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: false,
            }),
            ImageExtension,
            Underline,
            Highlight,
            Color,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-lg">
            <div className="border-b p-2 flex gap-2 flex-wrap">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                    title="In đậm (Ctrl + B)"
                >
                    <strong>B</strong>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                    title="In nghiêng (Ctrl + I)"
                >
                    <em>I</em>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
                    title="Gạch chân (Ctrl + U)"
                >
                    <u>U</u>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-2 rounded ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
                    title="Gạch ngang"
                >
                    <s>S</s>
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
                    title="Căn trái"
                >
                    ←
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
                    title="Căn giữa"
                >
                    ↔
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
                    title="Căn phải"
                >
                    →
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                    title="Danh sách không đánh số (Ctrl + Shift + 8)"
                >
                    •
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                    title="Danh sách đánh số (Ctrl + Shift + 7)"
                >
                    1.
                </button>
                <button
                    onClick={() => {
                        const url = window.prompt('Nhập URL:');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        }
                    }}
                    className={`p-2 rounded ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
                    title="Thêm liên kết (Ctrl + K)"
                >
                    🔗
                </button>
            </div>
            <EditorContent editor={editor} className="p-4 min-h-[200px] prose max-w-none" />
            <div className="border-t p-2 text-sm text-gray-500">
                <p>Hướng dẫn sử dụng danh sách:</p>
                <ul className="list-disc pl-5 mt-1">
                    <li>Nhấn nút &quot;•&quot; để tạo danh sách không đánh số</li>
                    <li>Nhấn nút &quot;1.&quot; để tạo danh sách có đánh số</li>
                    <li>Nhấn Enter để tạo mục mới</li>
                    <li>Nhấn Tab để thụt lề mục hiện tại</li>
                    <li>Nhấn Shift + Tab để giảm thụt lề</li>
                    <li>Nhấn Enter 2 lần để thoát khỏi danh sách</li>
                </ul>
            </div>
        </div>
    );
};

export default function CreateTest() {
    const [test, setTest] = useState<Test>({
        test_slug: '',
        type: 'reading',
        level: 'academic',
        title: '',
        duration: 0,
        passages: []
    });

    const [currentPassage, setCurrentPassage] = useState<Passage>({
        passage_number: 1,
        title: '',
        content: {
            type: 'text',
            value: ''
        },
        question_groups: []
    });

    const [currentGroup, setCurrentGroup] = useState<QuestionGroup>({
        group_title: '',
        group_instruction: '',
        content: {
            type: 'text',
            value: ''
        },
        given_words: [],
        questions: []
    });

    const [currentQuestion, setCurrentQuestion] = useState<Question>({
        question_number: 1,
        question_type: 'multiple-choice',
        question_text: '',
        options: [],
        answer: [],
        explaination: ''
    });

    // Thêm các state để theo dõi trạng thái chỉnh sửa
    const [editingPassageIndex, setEditingPassageIndex] = useState<number | null>(null);
    const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

    // Tự tạo test slug từ title
    useEffect(() => {
        if (test.title) {
            const slug = test.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setTest(prev => ({ ...prev, test_slug: slug }));
        }
    }, [test.title]);

    // Xử lý upload file audio
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('audio', file);

            const res = await fetch(`${process.env.NEXT_PUBLIC_UPLOAD_AUDIO_FILE_API_URL}`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error('Upload failed');
            }

            const data = await res.json();
            if (data.success) {
                setCurrentPassage(prev => ({ ...prev, audio_url: data.url }));
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Lỗi khi upload audio');
        }
    };

    // Xử lý upload ảnh cho content
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'passage' | 'group') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch(`${process.env.NEXT_PUBLIC_UPLOAD_IMAGE_FILE_API_URL}`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error('Upload failed');
            }

            const data = await res.json();
            if (data.success) {
                if (type === 'passage') {
                    setCurrentPassage(prev => ({
                        ...prev,
                        content: {
                            type: 'image',
                            value: data.url
                        }
                    }));
                } else {
                    setCurrentGroup(prev => ({
                        ...prev,
                        content: {
                            type: 'image',
                            value: data.url
                        }
                    }));
                }
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Lỗi khi upload ảnh');
        }
    };

    // Hàm xử lý chỉnh sửa passage
    const handleEditPassage = (index: number) => {
        const passageToEdit = test.passages[index];
        setCurrentPassage(passageToEdit);
        setEditingPassageIndex(index);
    };

    // Hàm xử lý chỉnh sửa group
    const handleEditGroup = (groupIndex: number) => {
        const groupToEdit = currentPassage.question_groups[groupIndex];
        setCurrentGroup(groupToEdit);
        setEditingGroupIndex(groupIndex);
    };

    // Hàm xử lý chỉnh sửa question
    const handleEditQuestion = (questionIndex: number) => {
        const questionToEdit = currentGroup.questions[questionIndex];
        setCurrentQuestion(questionToEdit);
        setEditingQuestionIndex(questionIndex);
    };

    // Cập nhật hàm handleAddPassage để xử lý cả thêm mới và chỉnh sửa
    const handleAddPassage = () => {
        if (!currentPassage.title) {
            alert('Vui lòng nhập tiêu đề passage');
            return;
        }

        if (!currentPassage.content?.value) {
            alert('Vui lòng nhập nội dung passage');
            return;
        }

        if (currentPassage.question_groups.length === 0) {
            alert('Vui lòng thêm ít nhất một nhóm câu hỏi');
            return;
        }

        if (editingPassageIndex !== null) {
            // Cập nhật passage hiện có
            const newPassages = [...test.passages];
            newPassages[editingPassageIndex] = currentPassage;
            setTest(prev => ({
                ...prev,
                passages: newPassages
            }));
            setEditingPassageIndex(null);
        } else {
            // Thêm passage mới
            setTest(prev => ({
                ...prev,
                passages: [...prev.passages, currentPassage]
            }));
        }

        // Reset current passage
        setCurrentPassage({
            passage_number: currentPassage.passage_number + 1,
            title: '',
            content: {
                type: 'text',
                value: ''
            },
            question_groups: []
        });

        // Reset current group
        setCurrentGroup({
            group_title: '',
            group_instruction: '',
            content: {
                type: 'text',
                value: ''
            },
            given_words: [],
            questions: []
        });

        // Reset current question với số thứ tự mới
        setCurrentQuestion({
            question_number: 1,
            question_type: 'multiple-choice',
            question_text: '',
            options: [],
            answer: [],
            explaination: ''
        });
    };

    // Cập nhật hàm handleAddQuestionGroup để xử lý cả thêm mới và chỉnh sửa
    const handleAddQuestionGroup = () => {
        if (currentGroup.questions.length === 0) {
            alert('Vui lòng thêm ít nhất một câu hỏi vào nhóm');
            return;
        }

        const groupToAdd = {
            ...currentGroup,
            content: currentGroup.content?.value ? currentGroup.content : undefined
        };

        if (editingGroupIndex !== null && editingPassageIndex !== null) {
            // Cập nhật group hiện có
            const newPassages = [...test.passages];
            newPassages[editingPassageIndex].question_groups[editingGroupIndex] = groupToAdd;
            setTest(prev => ({
                ...prev,
                passages: newPassages
            }));
            setEditingGroupIndex(null);
        } else {
            // Thêm group mới
            setCurrentPassage(prev => ({
                ...prev,
                question_groups: [...prev.question_groups, groupToAdd]
            }));
        }

        // Reset current group
        setCurrentGroup({
            group_title: '',
            group_instruction: '',
            content: {
                type: 'text',
                value: ''
            },
            given_words: [],
            questions: []
        });

        // Reset current question với số thứ tự mới
        setCurrentQuestion({
            question_number: 1,
            question_type: 'multiple-choice',
            question_text: '',
            options: [],
            answer: [],
            explaination: ''
        });
    };

    // Cập nhật hàm handleAddQuestionToGroup để xử lý cả thêm mới và chỉnh sửa
    const handleAddQuestionToGroup = () => {
        if (!currentQuestion.question_text) {
            alert('Vui lòng nhập nội dung câu hỏi');
            return;
        }
        if (!currentQuestion.answer.length) {
            alert('Vui lòng nhập đáp án');
            return;
        }

        if (editingQuestionIndex !== null) {
            // Cập nhật question hiện có
            const newQuestions = [...currentGroup.questions];
            newQuestions[editingQuestionIndex] = currentQuestion;
            setCurrentGroup(prev => ({
                ...prev,
                questions: newQuestions
            }));
            setEditingQuestionIndex(null);
        } else {
            // Thêm question mới
            setCurrentGroup(prev => ({
                ...prev,
                questions: [...prev.questions, currentQuestion]
            }));
        }

        // Reset current question
        setCurrentQuestion({
            question_number: 1,
            question_type: 'multiple-choice',
            question_text: '',
            options: [],
            answer: [],
            explaination: ''
        });
    };

    const handleSubmitTest = async () => {
        try {
            // Validate test data
            if (!test.title || test.passages.length === 0) {
                alert('Vui lòng nhập đầy đủ thông tin bài test');
                return;
            }

            // Format dữ liệu trước khi gửi
            const testToSubmit = {
                test_slug: test.test_slug,
                type: test.type,
                level: test.level,
                title: test.title,
                duration: test.duration,
                passages: test.passages.map(passage => ({
                    passage_number: passage.passage_number,
                    title: passage.title,
                    content: passage.content?.value ? passage.content : undefined,
                    audio_url: passage.audio_url,
                    question_groups: passage.question_groups.map(group => ({
                        group_title: group.group_title,
                        group_instruction: group.group_instruction,
                        content: group.content?.value ? group.content : undefined,
                        given_words: group.given_words,
                        questions: group.questions.map(question => ({
                            question_number: question.question_number,
                            question_type: question.question_type,
                            question_text: question.question_text,
                            options: question.options,
                            answer: question.answer,
                            explaination: question.explaination
                        }))
                    }))
                }))
            };

            // Submit to backend
            const res = await fetch(`${process.env.NEXT_PUBLIC_CREATE_TEST_API_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testToSubmit),
                credentials: 'include'
            });
            if (!res.ok) {
                throw new Error('Gửi bài test thất bại');
            }
            const data = await res.json();
            
            // Kiểm tra response status và data
            if (data.success) {
                alert('Lưu bài test thành công');
                // Reset form
                setTest({
                    test_slug: '',
                    type: 'reading',
                    level: 'academic',
                    title: '',
                    duration: 0,
                    passages: []
                });
                setCurrentPassage({
                    passage_number: 1,
                    title: '',
                    content: {
                        type: 'text',
                        value: ''
                    },
                    question_groups: []
                });
                setCurrentGroup({
                    group_title: '',
                    group_instruction: '',
                    content: {
                        type: 'text',
                        value: ''
                    },
                    given_words: [],
                    questions: []
                });
                setCurrentQuestion({
                    question_number: 1,
                    question_type: 'multiple-choice',
                    question_text: '',
                    options: [],
                    answer: [],
                    explaination: ''
                });
            } else {
                throw new Error(data.message || 'Gửi bài test thất bại');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert(error instanceof Error ? error.message : 'Gửi bài test thất bại');
        }
    };

    // Sửa lại phần hiển thị câu hỏi trong danh sách
    const renderQuestions = () => {
        return currentGroup.questions.map((question, index) => {
            console.log('Rendering question:', question);
            return (
                <div key={index} className="p-4 border rounded bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-lg">Câu {question.question_number}</p>
                            <p className="mt-1">{question.question_text}</p>
                            <p className="text-sm text-gray-600 mt-1">Loại: {question.question_type}</p>
                            <p className="text-sm text-gray-600">Đáp án: {question.answer.join(', ')}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEditQuestion(index)}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Chỉnh sửa
                            </button>
                            <button
                                onClick={() => {
                                    const newQuestions = currentGroup.questions.filter((_, i) => i !== index);
                                    setCurrentGroup(prev => ({
                                        ...prev,
                                        questions: newQuestions
                                    }));
                                }}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Tạo bài kiểm tra mới</h1>
                <button
                    onClick={handleSubmitTest}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Lưu bài test
                </button>
            </div>
            
            {/* Test Info */}
            <div className="mb-6 p-4 border rounded-lg bg-white">
                <h2 className="text-xl font-semibold mb-4">Thông tin bài kiểm tra</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2">
                            Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={test.title}
                            onChange={(e) => setTest(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">
                            Test Slug <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={test.test_slug}
                            readOnly
                            className="w-full p-2 border rounded bg-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">
                            Loại bài kiểm tra <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={test.type}
                            onChange={(e) => setTest(prev => ({ ...prev, type: e.target.value as TestType }))}
                            className="w-full p-2 border rounded"
                        >
                            <option value="reading">Reading</option>
                            <option value="listening">Listening</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2">
                            Cấp độ <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={test.level}
                            onChange={(e) => setTest(prev => ({ ...prev, level: e.target.value as TestLevel }))}
                            className="w-full p-2 border rounded"
                        >
                            <option value="academic">Academic</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2">
                            Thời gian (phút) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={test.duration || ''}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setTest(prev => ({ 
                                    ...prev, 
                                    duration: isNaN(value) ? 0 : value 
                                }));
                            }}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>
            </div>

            {/* Current Passage */}
            <div className="mb-6 p-6 border rounded-lg bg-white shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-blue-600">Passage {currentPassage.passage_number}</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 font-semibold">
                            Tiêu đề Passage <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={currentPassage.title}
                            onChange={(e) => setCurrentPassage(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {test.type === 'listening' && (
                        <div>
                            <label className="block mb-2 font-semibold">File Audio</label>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleAudioUpload}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {currentPassage.audio_url && (
                                <div className="mt-2 text-sm text-green-600">
                                    File đã được upload thành công
                                </div>
                            )}
                        </div>
                    )}

                    {test.type === 'listening' && (
                        <div>
                            <label className="block mb-2 font-semibold">Transcript (Không bắt buộc)</label>
                            <textarea
                                value={currentPassage.transcript || ''}
                                onChange={(e) => setCurrentPassage(prev => ({ ...prev, transcript: e.target.value }))}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                placeholder="Nhập transcript cho bài nghe (không bắt buộc)"
                            />
                        </div>
                    )}
                </div>

                {/* Passage Content */}
                <div className="mt-6">
                    <label className="block mb-2 font-semibold">
                        Nội dung Passage <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2">Loại nội dung</label>
                            <select
                                value={currentPassage.content?.type || 'text'}
                                onChange={(e) => setCurrentPassage(prev => ({
                                    ...prev,
                                    content: {
                                        type: e.target.value as ContentType,
                                        value: prev.content?.value || ''
                                    }
                                }))}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="text">Text</option>
                                <option value="image">Image</option>
                                <option value="html">HTML</option>
                            </select>
                        </div>

                        {currentPassage.content?.type === 'text' && (
                            <RichTextEditor
                                content={currentPassage.content?.value || ''}
                                onChange={(value) => setCurrentPassage(prev => ({
                                    ...prev,
                                    content: {
                                        type: prev.content?.type || 'text',
                                        value: value
                                    }
                                }))}
                            />
                        )}

                        {currentPassage.content?.type === 'image' && (
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'passage')}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {currentPassage.content?.value && (
                                    <div className="mt-2">
                                        <Image 
                                            src={currentPassage.content.value} 
                                            alt="Passage content" 
                                            width={500}
                                            height={300}
                                            className="max-w-full h-auto rounded-lg shadow-md"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {currentPassage.content?.type === 'html' && (
                            <textarea
                                value={currentPassage.content?.value || ''}
                                onChange={(e) => setCurrentPassage(prev => ({
                                    ...prev,
                                    content: {
                                        type: 'html',
                                        value: e.target.value
                                    }
                                }))}
                                className="w-full p-2 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={10}
                                placeholder="Nhập HTML content..."
                            />
                        )}
                    </div>
                </div>

                {/* Question Groups */}
                <div className="mt-8">
                    <h3 className="text-xl font-bold mb-6 text-green-600">Nhóm câu hỏi</h3>

                    {/* Question Groups List */}
                    {currentPassage.question_groups.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold mb-4 text-gray-700">Danh sách nhóm câu hỏi đã thêm</h4>
                            <div className="space-y-4">
                                {currentPassage.question_groups.map((group, index) => (
                                    <div key={index} className="p-4 border rounded bg-gray-50 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-lg">Nhóm {index + 1}: {group.group_title}</p>
                                                {group.group_instruction && (
                                                    <p className="text-sm text-gray-600 mt-1">Hướng dẫn: {group.group_instruction}</p>
                                                )}
                                                {group.content && (
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-600">Nội dung nhóm:</p>
                                                        {group.content.type === 'text' && (
                                                            <p className="text-sm mt-1">{group.content.value}</p>
                                                        )}
                                                        {group.content.type === 'image' && group.content.value && (
                                                            <Image 
                                                                src={group.content.value} 
                                                                alt="Group content" 
                                                                width={500}
                                                                height={300}
                                                                className="max-w-full h-auto mt-2 rounded-lg shadow-sm"
                                                            />
                                                        )}
                                                        {group.content.type === 'html' && group.content.value && (
                                                            <div 
                                                                className="text-sm mt-2"
                                                                dangerouslySetInnerHTML={{ __html: group.content.value }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                {group.given_words && group.given_words.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-600">Từ cho sẵn:</p>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {group.given_words.map((word, wordIndex) => (
                                                                <span 
                                                                    key={wordIndex}
                                                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                                                                >
                                                                    {word}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-sm text-gray-600 mt-2">
                                                    Số câu hỏi: {group.questions.length}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditGroup(index)}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                                >
                                                    Chỉnh sửa
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newGroups = currentPassage.question_groups.filter((_, i) => i !== index);
                                                        setCurrentPassage(prev => ({
                                                            ...prev,
                                                            question_groups: newGroups
                                                        }));
                                                    }}
                                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Group Info */}
                        <div className="p-6 border rounded bg-gray-50 shadow-sm">
                            <h4 className="text-xl font-bold mb-6 text-purple-600">Thông tin nhóm câu hỏi</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2 font-semibold">Tiêu đề nhóm</label>
                                    <input
                                        type="text"
                                        value={currentGroup.group_title}
                                        onChange={(e) => setCurrentGroup(prev => ({ ...prev, group_title: e.target.value }))}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Nhập tiêu đề nhóm câu hỏi"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-semibold">Hướng dẫn</label>
                                    <input
                                        type="text"
                                        value={currentGroup.group_instruction}
                                        onChange={(e) => setCurrentGroup(prev => ({ ...prev, group_instruction: e.target.value }))}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Nhập hướng dẫn cho nhóm câu hỏi"
                                    />
                                </div>
                            </div>

                            {/* Group Content */}
                            <div className="mt-6">
                                <label className="block mb-2 font-semibold">Nội dung nhóm câu hỏi</label>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block mb-2">Loại nội dung</label>
                                        <select
                                            value={currentGroup.content?.type || 'text'}
                                            onChange={(e) => setCurrentGroup(prev => ({
                                                ...prev,
                                                content: {
                                                    type: e.target.value as ContentType,
                                                    value: prev.content?.value || ''
                                                }
                                            }))}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="text">Text</option>
                                            <option value="image">Image</option>
                                            <option value="html">HTML</option>
                                        </select>
                                    </div>

                                    {currentGroup.content?.type === 'text' && (
                                        <RichTextEditor
                                            content={currentGroup.content?.value || ''}
                                            onChange={(value) => setCurrentGroup(prev => ({
                                                ...prev,
                                                content: {
                                                    type: prev.content?.type || 'text',
                                                    value: value
                                                }
                                            }))}
                                        />
                                    )}

                                    {currentGroup.content?.type === 'image' && (
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'group')}
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                            {currentGroup.content?.value && (
                                                <div className="mt-2">
                                                    <Image 
                                                        src={currentGroup.content.value} 
                                                        alt="Group content" 
                                                        width={500}
                                                        height={300}
                                                        className="max-w-full h-auto rounded-lg shadow-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {currentGroup.content?.type === 'html' && (
                                        <textarea
                                            value={currentGroup.content?.value || ''}
                                            onChange={(e) => setCurrentGroup(prev => ({
                                                ...prev,
                                                content: {
                                                    type: 'html',
                                                    value: e.target.value
                                                }
                                            }))}
                                            className="w-full p-2 border rounded font-mono focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            rows={5}
                                            placeholder="Nhập HTML content cho nhóm câu hỏi"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Given Words */}
                        <div className="p-6 border rounded bg-gray-50 shadow-sm">
                            <h4 className="text-xl font-bold mb-6 text-indigo-600">Từ cho sẵn</h4>
                            <div className="space-y-2">
                                {currentGroup.given_words?.map((word, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={word}
                                            onChange={(e) => {
                                                const newWords = [...(currentGroup.given_words || [])];
                                                newWords[index] = e.target.value;
                                                setCurrentGroup(prev => ({ 
                                                    ...prev, 
                                                    given_words: newWords 
                                                }));
                                            }}
                                            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Nhập từ cho sẵn"
                                        />
                                        <button
                                            onClick={() => {
                                                const newWords = [...(currentGroup.given_words || [])];
                                                newWords.splice(index, 1);
                                                setCurrentGroup(prev => ({ 
                                                    ...prev, 
                                                    given_words: newWords 
                                                }));
                                            }}
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        setCurrentGroup(prev => ({ 
                                            ...prev, 
                                            given_words: [...(prev.given_words || []), ''] 
                                        }));
                                    }}
                                    className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                                >
                                    Thêm từ
                                </button>
                            </div>
                        </div>

                        {/* Current Question */}
                        <div className="p-6 border rounded bg-gray-50 shadow-sm">
                            <h4 className="text-xl font-bold mb-6 text-pink-600">Thêm câu hỏi mới</h4>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 font-semibold">Số thứ tự câu hỏi <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={currentQuestion.question_number}
                                            onChange={(e) => setCurrentQuestion(prev => ({ 
                                                ...prev, 
                                                question_number: parseInt(e.target.value) || 1
                                            }))}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold">Loại câu hỏi</label>
                                        <select
                                            value={currentQuestion.question_type}
                                            onChange={(e) => setCurrentQuestion(prev => ({ 
                                                ...prev, 
                                                question_type: e.target.value as QuestionType 
                                            }))}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        >
                                            <option value="multiple-choice">Multiple Choice</option>
                                            <option value="fill-in-blank">Fill in Blank</option>
                                            <option value="matching">Matching</option>
                                            <option value="true-false-not-given">True/False/Not Given</option>
                                            <option value="fill-in-blank-optional">Fill in Blank (Optional)</option>
                                            <option value="map">Map</option>
                                            <option value="correct-optional">Correct Optional</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-2 font-semibold">
                                        Nội dung câu hỏi <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={currentQuestion.question_text}
                                        onChange={(e) => setCurrentQuestion(prev => ({ 
                                            ...prev, 
                                            question_text: e.target.value 
                                        }))}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        rows={3}
                                        placeholder="Nhập nội dung câu hỏi"
                                    />
                                </div>

                                {/* Options for Multiple Choice and Correct Optional */}
                                {(currentQuestion.question_type === 'multiple-choice' || currentQuestion.question_type === 'correct-optional' || currentQuestion.question_type === 'matching') && (
                                    <div className="mt-4">
                                        <label className="block mb-2 font-semibold">
                                            Lựa chọn <span className="text-red-500">*</span>
                                        </label>
                                        <div className="space-y-2">
                                            {(currentQuestion.options || []).map((option, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newOptions = [...(currentQuestion.options || [])];
                                                            newOptions[index] = e.target.value;
                                                            setCurrentQuestion(prev => ({ 
                                                                ...prev, 
                                                                options: newOptions 
                                                            }));
                                                        }}
                                                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                                        placeholder={`Nhập lựa chọn ${index + 1}`}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newOptions = (currentQuestion.options || []).filter((_, i) => i !== index);
                                                            setCurrentQuestion(prev => ({ 
                                                                ...prev, 
                                                                options: newOptions 
                                                            }));
                                                        }}
                                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    setCurrentQuestion(prev => ({ 
                                                        ...prev, 
                                                        options: [...(prev.options || []), ''] 
                                                    }));
                                                }}
                                                className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
                                            >
                                                Thêm lựa chọn
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Answer */}
                                <div className="mt-4">
                                    <label className="block mb-2 font-semibold">
                                        Đáp án <span className="text-red-500">*</span>
                                    </label>
                                    {currentQuestion.question_type === 'multiple-choice' ? (
                                        <div className="space-y-2">
                                            {(currentQuestion.options || []).map((option, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentQuestion.answer.includes(option)}
                                                        onChange={(e) => {
                                                            const newAnswer = e.target.checked
                                                                ? [...currentQuestion.answer, option]
                                                                : currentQuestion.answer.filter(a => a !== option);
                                                            setCurrentQuestion(prev => ({ 
                                                                ...prev, 
                                                                answer: newAnswer 
                                                            }));
                                                        }}
                                                        className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                                                    />
                                                    <span className="text-gray-700">{option}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : currentQuestion.question_type === 'matching' ? (
                                        <div className="space-y-2">
                                            {(currentQuestion.options || []).map((option, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <span className="w-1/3">{option}</span>
                                                    <input
                                                        type="text"
                                                        value={currentQuestion.answer[index] || ''}
                                                        onChange={(e) => {
                                                            const newAnswer = [...(currentQuestion.answer || [])];
                                                            newAnswer[index] = e.target.value;
                                                            setCurrentQuestion(prev => ({ 
                                                                ...prev, 
                                                                answer: newAnswer 
                                                            }));
                                                        }}
                                                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                                        placeholder="Nhập đáp án tương ứng"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : currentQuestion.question_type === 'true-false-not-given' ? (
                                        <select
                                            value={currentQuestion.answer[0] || ''}
                                            onChange={(e) => setCurrentQuestion(prev => ({ 
                                                ...prev, 
                                                answer: [e.target.value] 
                                            }))}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        >
                                            <option value="">Select an option</option>
                                            <option value="true">True</option>
                                            <option value="false">False</option>
                                            <option value="not given">Not Given</option>
                                        </select>
                                    ) : currentQuestion.question_type === 'fill-in-blank-optional' || currentQuestion.question_type === 'map' ? (
                                        <select
                                            value={currentQuestion.answer[0] || ''}
                                            onChange={(e) => setCurrentQuestion(prev => ({ 
                                                ...prev, 
                                                answer: [e.target.value] 
                                            }))}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        >
                                            <option value="">Select an option</option>
                                            {(currentGroup.given_words || []).map((word, index) => (
                                                <option key={index} value={word}>
                                                    {word}
                                                </option>
                                            ))}
                                        </select>
                                    ) : currentQuestion.question_type === 'correct-optional' ? (
                                        <div className="space-y-2">
                                            {(currentQuestion.options || []).map((option, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentQuestion.answer.includes(option)}
                                                        onChange={(e) => {
                                                            const newAnswer = e.target.checked
                                                                ? [...currentQuestion.answer, option]
                                                                : currentQuestion.answer.filter(a => a !== option);
                                                            setCurrentQuestion(prev => ({ 
                                                                ...prev, 
                                                                answer: newAnswer 
                                                            }));
                                                        }}
                                                        className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                                                    />
                                                    <span className="text-gray-700">{option}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={currentQuestion.answer[0] || ''}
                                            onChange={(e) => setCurrentQuestion(prev => ({ 
                                                ...prev, 
                                                answer: [e.target.value] 
                                            }))}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                            placeholder="Nhập đáp án"
                                        />
                                    )}
                                </div>

                                {/* Explanation */}
                                <div className="mt-4">
                                    <label className="block mb-2 font-semibold">Giải thích</label>
                                    <textarea
                                        value={currentQuestion.explaination}
                                        onChange={(e) => setCurrentQuestion(prev => ({ 
                                            ...prev, 
                                            explaination: e.target.value 
                                        }))}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        rows={3}
                                        placeholder="Nhập giải thích cho đáp án"
                                    />
                                </div>

                                {/* Add Question Button */}
                                <div className="mt-4">
                                    <button
                                        onClick={() => {
                                            if (!currentQuestion.question_text) {
                                                alert('Vui lòng nhập nội dung câu hỏi');
                                                return;
                                            }
                                            if (!currentQuestion.answer.length) {
                                                alert('Vui lòng nhập đáp án');
                                                return;
                                            }
                                            handleAddQuestionToGroup();
                                        }}
                                        className="px-6 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
                                    >
                                        Thêm câu hỏi vào nhóm
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Questions List */}
                        {currentGroup.questions.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-lg font-semibold mb-4 text-gray-700">Danh sách câu hỏi đã thêm</h4>
                                <div className="space-y-4">
                                    {renderQuestions()}
                                </div>
                            </div>
                        )}

                        {/* Add Question Group Button */}
                        <div className="mt-4">
                            <button
                                onClick={() => {
                                    if (!currentGroup.questions.length) {
                                        alert('Vui lòng thêm ít nhất một câu hỏi vào nhóm');
                                        return;
                                    }
                                    handleAddQuestionGroup();
                                }}
                                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                                Thêm nhóm câu hỏi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Passage Button */}
            <button
                onClick={handleAddPassage}
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
                Thêm Passage
            </button>

            {/* Passages List */}
            {test.passages.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-xl font-bold mb-4 text-blue-600">Danh sách Passages</h3>
                    <div className="space-y-4">
                        {test.passages.map((passage, index) => (
                            <div key={index} className="p-4 border rounded bg-white shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-lg">Passage {passage.passage_number}</p>
                                        <p className="mt-1">{passage.title}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditPassage(index)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        >
                                            Chỉnh sửa
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newPassages = test.passages.filter((_, i) => i !== index);
                                                setTest(prev => ({ ...prev, passages: newPassages }));
                                            }}
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}