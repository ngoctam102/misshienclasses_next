'use client';
import React, { useState, useEffect } from 'react';
import { Test, Passage, QuestionGroup, Question, TestType, TestLevel, QuestionType, ContentType } from '@/types/test';

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

    // Tính toán số thứ tự câu hỏi tiếp theo
    const getNextQuestionNumber = () => {
        let maxNumber = 0;
        test.passages.forEach(passage => {
            passage.question_groups.forEach(group => {
                group.questions.forEach(question => {
                    maxNumber = Math.max(maxNumber, question.question_number);
                });
            });
        });
        return maxNumber + 1;
    };

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

        setTest(prev => ({
            ...prev,
            passages: [...prev.passages, currentPassage]
        }));

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

        // Reset current question với số thứ tự tiếp theo
        setCurrentQuestion({
            question_number: getNextQuestionNumber(),
            question_type: 'multiple-choice',
            question_text: '',
            options: [],
            answer: [],
            explaination: ''
        });
    };

    const handleAddQuestionToGroup = () => {
        const nextNumber = getNextQuestionNumber();
        const newQuestion: Question = {
            ...currentQuestion,
            question_number: nextNumber
        };

        setCurrentGroup(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));

        // Reset current question với số thứ tự tiếp theo
        setCurrentQuestion({
            question_number: nextNumber + 1,
            question_type: 'multiple-choice',
            question_text: '',
            options: [],
            answer: [],
            explaination: ''
        });
    };

    const handleAddQuestionGroup = () => {
        if (currentGroup.questions.length === 0) {
            alert('Vui lòng thêm ít nhất một câu hỏi vào nhóm');
            return;
        }

        setCurrentPassage(prev => ({
            ...prev,
            question_groups: [...prev.question_groups, currentGroup]
        }));

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

        // Reset current question với số thứ tự tiếp theo
        setCurrentQuestion({
            question_number: getNextQuestionNumber(),
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
                    content: passage.content,
                    audio_url: passage.audio_url,
                    question_groups: passage.question_groups.map(group => ({
                        group_title: group.group_title,
                        group_instruction: group.group_instruction,
                        content: group.content,
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
            <div className="mb-6 p-4 border rounded-lg bg-white">
                <h2 className="text-xl font-semibold mb-4">Passage {currentPassage.passage_number}</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2">
                            Tiêu đề Passage <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={currentPassage.title}
                            onChange={(e) => setCurrentPassage(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    {test.type === 'listening' && (
                        <div>
                            <label className="block mb-2">File Audio</label>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleAudioUpload}
                                className="w-full p-2 border rounded"
                            />
                            {currentPassage.audio_url && (
                                <div className="mt-2 text-sm text-green-600">
                                    File đã được upload thành công
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Passage Content */}
                <div className="mt-4">
                    <label className="block mb-2">
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
                                className="w-full p-2 border rounded"
                            >
                                <option value="text">Text</option>
                                <option value="image">Image</option>
                                <option value="html">HTML</option>
                            </select>
                        </div>

                        {currentPassage.content?.type === 'text' && (
                            <textarea
                                value={currentPassage.content?.value || ''}
                                onChange={(e) => setCurrentPassage(prev => ({
                                    ...prev,
                                    content: {
                                        type: prev.content?.type || 'text',
                                        value: e.target.value
                                    }
                                }))}
                                className="w-full p-2 border rounded"
                                rows={10}
                            />
                        )}

                        {currentPassage.content?.type === 'image' && (
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'passage')}
                                    className="w-full p-2 border rounded"
                                />
                                {currentPassage.content?.value && (
                                    <div className="mt-2">
                                        <img 
                                            src={currentPassage.content.value} 
                                            alt="Passage content" 
                                            className="max-w-full h-auto"
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
                                className="w-full p-2 border rounded font-mono"
                                rows={10}
                                placeholder="Nhập HTML content..."
                            />
                        )}
                    </div>
                </div>

                {/* Question Groups */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Nhóm câu hỏi</h3>

                    {/* Question Groups List */}
                    {currentPassage.question_groups.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-md font-semibold mb-4">Danh sách nhóm câu hỏi đã thêm</h4>
                            <div className="space-y-4">
                                {currentPassage.question_groups.map((group, index) => (
                                    <div key={index} className="p-4 border rounded bg-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">Nhóm {index + 1}: {group.group_title}</p>
                                                {group.group_instruction && (
                                                    <p className="text-sm text-gray-600">Hướng dẫn: {group.group_instruction}</p>
                                                )}
                                                {group.content && (
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-600">Nội dung nhóm:</p>
                                                        {group.content.type === 'text' && (
                                                            <p className="text-sm">{group.content.value}</p>
                                                        )}
                                                        {group.content.type === 'image' && (
                                                            <img 
                                                                src={group.content.value} 
                                                                alt="Group content" 
                                                                className="max-w-full h-auto mt-2"
                                                            />
                                                        )}
                                                        {group.content.type === 'html' && (
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
                                                                    className="px-2 py-1 bg-gray-100 rounded text-sm"
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
                                            <button
                                                onClick={() => {
                                                    const newGroups = currentPassage.question_groups.filter((_, i) => i !== index);
                                                    setCurrentPassage(prev => ({
                                                        ...prev,
                                                        question_groups: newGroups
                                                    }));
                                                }}
                                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Group Info */}
                        <div className="p-4 border rounded bg-gray-50">
                            <h4 className="font-semibold mb-4">Thông tin nhóm câu hỏi</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2">Tiêu đề nhóm</label>
                                    <input
                                        type="text"
                                        value={currentGroup.group_title}
                                        onChange={(e) => setCurrentGroup(prev => ({ ...prev, group_title: e.target.value }))}
                                        className="w-full p-2 border rounded"
                                        placeholder="Nhập tiêu đề nhóm câu hỏi"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2">Hướng dẫn</label>
                                    <input
                                        type="text"
                                        value={currentGroup.group_instruction}
                                        onChange={(e) => setCurrentGroup(prev => ({ ...prev, group_instruction: e.target.value }))}
                                        className="w-full p-2 border rounded"
                                        placeholder="Nhập hướng dẫn cho nhóm câu hỏi"
                                    />
                                </div>
                            </div>

                            {/* Group Content */}
                            <div className="mt-4">
                                <label className="block mb-2">Nội dung nhóm câu hỏi</label>
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
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="text">Text</option>
                                            <option value="image">Image</option>
                                            <option value="html">HTML</option>
                                        </select>
                                    </div>

                                    {currentGroup.content?.type === 'text' && (
                                        <textarea
                                            value={currentGroup.content?.value || ''}
                                            onChange={(e) => setCurrentGroup(prev => ({
                                                ...prev,
                                                content: {
                                                    type: prev.content?.type || 'text',
                                                    value: e.target.value
                                                }
                                            }))}
                                            className="w-full p-2 border rounded"
                                            rows={5}
                                            placeholder="Nhập nội dung cho nhóm câu hỏi"
                                        />
                                    )}

                                    {currentGroup.content?.type === 'image' && (
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'group')}
                                                className="w-full p-2 border rounded"
                                            />
                                            {currentGroup.content?.value && (
                                                <div className="mt-2">
                                                    <img 
                                                        src={currentGroup.content.value} 
                                                        alt="Group content" 
                                                        className="max-w-full h-auto"
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
                                            className="w-full p-2 border rounded font-mono"
                                            rows={5}
                                            placeholder="Nhập HTML content cho nhóm câu hỏi"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Given Words */}
                        <div className="p-4 border rounded bg-gray-50">
                            <h4 className="font-semibold mb-4">Từ cho sẵn</h4>
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
                                            className="flex-1 p-2 border rounded"
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
                                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
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
                                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Thêm từ
                                </button>
                            </div>
                        </div>

                        {/* Current Question */}
                        <div className="p-4 border rounded bg-gray-50">
                            <h4 className="font-semibold mb-4">Thêm câu hỏi mới</h4>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2">Loại câu hỏi</label>
                                        <select
                                            value={currentQuestion.question_type}
                                            onChange={(e) => setCurrentQuestion(prev => ({ 
                                                ...prev, 
                                                question_type: e.target.value as QuestionType 
                                            }))}
                                            className="w-full p-2 border rounded"
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
                                    <div>
                                        <label className="block mb-2">
                                            Nội dung câu hỏi <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={currentQuestion.question_text}
                                            onChange={(e) => setCurrentQuestion(prev => ({ 
                                                ...prev, 
                                                question_text: e.target.value 
                                            }))}
                                            className="w-full p-2 border rounded"
                                            placeholder="Nhập nội dung câu hỏi"
                                        />
                                    </div>
                                </div>

                                {/* Options for Multiple Choice */}
                                {currentQuestion.question_type === 'multiple-choice' && (
                                    <div className="mt-4">
                                        <label className="block mb-2">
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
                                                        className="flex-1 p-2 border rounded"
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
                                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
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
                                                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Thêm lựa chọn
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Answer */}
                                <div className="mt-4">
                                    <label className="block mb-2">
                                        Đáp án <span className="text-red-500">*</span>
                                    </label>
                                    {currentQuestion.question_type === 'multiple-choice' ? (
                                        <select
                                            value={currentQuestion.answer[0] || ''}
                                            onChange={(e) => setCurrentQuestion(prev => ({ 
                                                ...prev, 
                                                answer: [e.target.value] 
                                            }))}
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="">Chọn đáp án</option>
                                            {(currentQuestion.options || []).map((option, index) => (
                                                <option key={index} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
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
                                                        className="flex-1 p-2 border rounded"
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
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="">Chọn đáp án</option>
                                            <option value="true">True</option>
                                            <option value="false">False</option>
                                            <option value="not-given">Not Given</option>
                                        </select>
                                    ) : currentQuestion.question_type === 'fill-in-blank-optional' || currentQuestion.question_type === 'map' ? (
                                        <select
                                            value={currentQuestion.answer[0] || ''}
                                            onChange={(e) => setCurrentQuestion(prev => ({ 
                                                ...prev, 
                                                answer: [e.target.value] 
                                            }))}
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="">Chọn đáp án</option>
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
                                                    />
                                                    <span>{option}</span>
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
                                            className="w-full p-2 border rounded"
                                            placeholder="Nhập đáp án"
                                        />
                                    )}
                                </div>

                                {/* Explanation */}
                                <div className="mt-4">
                                    <label className="block mb-2">Giải thích</label>
                                    <textarea
                                        value={currentQuestion.explaination}
                                        onChange={(e) => setCurrentQuestion(prev => ({ 
                                            ...prev, 
                                            explaination: e.target.value 
                                        }))}
                                        className="w-full p-2 border rounded"
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
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Thêm câu hỏi vào nhóm
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Questions List */}
                        {currentGroup.questions.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-md font-semibold mb-4">Danh sách câu hỏi đã thêm</h4>
                                <div className="space-y-4">
                                    {currentGroup.questions.map((question, index) => (
                                        <div key={index} className="p-4 border rounded bg-white">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">Câu {question.question_number}</p>
                                                    <p>{question.question_text}</p>
                                                    <p className="text-sm text-gray-600">Loại: {question.question_type}</p>
                                                    <p className="text-sm text-gray-600">Đáp án: {question.answer.join(', ')}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newQuestions = currentGroup.questions.filter((_, i) => i !== index);
                                                        setCurrentGroup(prev => ({ 
                                                            ...prev, 
                                                            questions: newQuestions 
                                                        }));
                                                    }}
                                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
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
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
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
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
                Thêm Passage
            </button>

            {/* Passages List */}
            {test.passages.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Danh sách Passages</h3>
                    <div className="space-y-4">
                        {test.passages.map((passage, index) => (
                            <div key={index} className="p-4 border rounded bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">Passage {passage.passage_number}</p>
                                        <p>{passage.title}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newPassages = test.passages.filter((_, i) => i !== index);
                                            setTest(prev => ({ ...prev, passages: newPassages }));
                                        }}
                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}