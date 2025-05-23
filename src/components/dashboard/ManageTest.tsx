'use client';

import { useState } from "react";
import useSWR from "swr";
import Image from 'next/image';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    IconButton,
    Stack,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    Checkbox
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon
} from "@mui/icons-material";
import { Test as BaseTest, TestType, TestLevel, Passage, QuestionGroup, Question, QuestionType, ContentType } from "@/types/test";

// Mở rộng interface Test để thêm _id
interface Test extends BaseTest {
    _id: string;
}

interface ApiError extends Error {
    info?: Record<string, unknown>;
    status?: number;
}

// Fetcher function
const fetcher = async (url: string) => {
    console.log('Fetching from URL:', url);
    const res = await fetch(url, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
    
    if (!res.ok) {
        const error = new Error('Lỗi khi fetch data') as ApiError;
        error.info = await res.json();
        error.status = res.status;
        throw error;
    }
    
    const response = await res.json();
    console.log('API Response:', response);
    console.log('Response type:', typeof response);
    console.log('Data type:', typeof response.data);
    console.log('Is Array?', Array.isArray(response.data));
    console.log('Array length:', Array.isArray(response.data) ? response.data.length : 0);
    
    if (Array.isArray(response.data)) {
        console.log('First item:', response.data[0]);
        console.log('First item keys:', Object.keys(response.data[0]));
    }
    
    return Array.isArray(response.data) ? response.data : [];
};

export default function ManageTest() {
    const [selectedTest, setSelectedTest] = useState<Test | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    const { data: tests = [], error, isLoading, mutate } = useSWR<Test[]>(
        process.env.NEXT_PUBLIC_ALL_TESTS_API_URL,
        fetcher
    );

    console.log('Current tests state:', tests);
    console.log('Tests length:', tests.length);
    console.log('Is loading:', isLoading);
    console.log('Has error:', !!error);

    // Hàm loại bỏ các trường không mong muốn
    const removeUnwantedFields = (obj: Record<string, unknown>): Record<string, unknown> => {
        const unwantedFields = ['_id', 'createdAt', 'updatedAt', '__v'];
        const result: Record<string, unknown> = {};

        for (const key in obj) {
            if (!unwantedFields.includes(key)) {
                if (Array.isArray(obj[key])) {
                    result[key] = (obj[key] as unknown[]).map((item) => 
                        typeof item === 'object' ? removeUnwantedFields(item as Record<string, unknown>) : item
                    );
                } else if (obj[key] && typeof obj[key] === 'object') {
                    result[key] = removeUnwantedFields(obj[key] as Record<string, unknown>);
                } else {
                    result[key] = obj[key];
                }
            }
        }

        return result;
    };

    // Cập nhật test
    const updateTest = async (testId: string, updatedData: Partial<Test>) => {
        try {
            console.log('Original data to update:', updatedData);

            // Chỉ lấy những trường cần thiết từ form data
            const cleanedData: Partial<Test> = {};

            // Nếu có thông tin cơ bản được cập nhật
            if (updatedData.test_slug) cleanedData.test_slug = updatedData.test_slug;
            if (updatedData.type) cleanedData.type = updatedData.type;
            if (updatedData.level) cleanedData.level = updatedData.level;
            if (updatedData.title) cleanedData.title = updatedData.title;
            if (updatedData.duration) cleanedData.duration = updatedData.duration;

            // Nếu có passages được cập nhật
            if (updatedData.passages) {
                cleanedData.passages = updatedData.passages.map(passage => {
                    const cleanedPassage: Passage = {
                        passage_number: passage.passage_number,
                        question_groups: []
                    };

                    if (passage.title) cleanedPassage.title = passage.title;
                    if (passage.content) cleanedPassage.content = passage.content;
                    if (passage.audio_url) cleanedPassage.audio_url = passage.audio_url;

                    // Nếu có question_groups được cập nhật
                    if (passage.question_groups) {
                        cleanedPassage.question_groups = passage.question_groups.map(group => {
                            const cleanedGroup: QuestionGroup = {
                                questions: []
                            };

                            if (group.group_title) cleanedGroup.group_title = group.group_title;
                            if (group.group_instruction) cleanedGroup.group_instruction = group.group_instruction;
                            if (group.content) cleanedGroup.content = group.content;
                            if (group.given_words) cleanedGroup.given_words = group.given_words;

                            // Nếu có questions được cập nhật
                            if (group.questions) {
                                cleanedGroup.questions = group.questions.map(question => {
                                    const updatedQuestion: Question = {
                                        question_number: question.question_number,
                                        question_type: question.question_type,
                                        question_text: question.question_text,
                                        answer: question.answer,
                                        explaination: question.explaination || ''
                                    };

                                    if (question.options) {
                                        updatedQuestion.options = question.options;
                                    }

                                    return updatedQuestion;
                                });
                            }

                            return cleanedGroup;
                        });
                    }

                    return cleanedPassage;
                });
            }

            // Loại bỏ các trường không mong muốn
            const finalData = removeUnwantedFields(cleanedData);
            console.log('Final data to send:', finalData);

            const response = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL}/${testId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(finalData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error response:', errorData);
                throw new Error(errorData.message || 'Không thể cập nhật test');
            }

            const responseData = await response.json();
            console.log('Server response:', responseData);
            
            await mutate();
            setOpenDialog(false);
            setIsEditing(false);
        } catch (error) {
            console.error('Lỗi khi cập nhật test:', error);
        }
    };

    // Xóa test
    const deleteTest = async (testId: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa test này?")) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL}/${testId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Không thể xóa test');
                }
                
                await mutate();
            } catch (error) {
                console.error('Lỗi khi xóa test:', error);
            }
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTest(null);
        setIsEditing(false);
    };

    const renderTestForm = (test: Test) => {
        const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            
            // Tạo một bản sao của test hiện tại
            const updatedData: Partial<Test> = {
                ...test,
                test_slug: formData.get("test_slug") as string,
                type: formData.get("type") as TestType,
                level: formData.get("level") as TestLevel,
                title: formData.get("title") as string,
                duration: Number(formData.get("duration"))
            };

            // Xử lý passages và questions
            if (test.passages) {
                updatedData.passages = test.passages.map((passage, passageIndex) => {
                    const updatedPassage: Passage = {
                        passage_number: passage.passage_number,
                        question_groups: []
                    };

                    // Lấy thông tin passage
                    const passageTitle = formData.get(`passages[${passageIndex}].title`) as string;
                    if (passageTitle) updatedPassage.title = passageTitle;

                    const passageContent = formData.get(`passages[${passageIndex}].content`) as string;
                    const passageContentType = formData.get(`passages[${passageIndex}].content_type`) as ContentType;
                    if (passageContent) {
                        updatedPassage.content = {
                            type: passageContentType || 'text',
                            value: passageContent
                        };
                    }

                    const passageAudioUrl = formData.get(`passages[${passageIndex}].audio_url`) as string;
                    if (passageAudioUrl) updatedPassage.audio_url = passageAudioUrl;

                    // Xử lý question groups
                    if (passage.question_groups) {
                        updatedPassage.question_groups = passage.question_groups.map((group, groupIndex) => {
                            const updatedGroup: QuestionGroup = {
                                questions: []
                            };

                            // Lấy thông tin group
                            const groupTitle = formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].group_title`) as string;
                            if (groupTitle) updatedGroup.group_title = groupTitle;

                            const groupInstruction = formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].group_instruction`) as string;
                            if (groupInstruction) updatedGroup.group_instruction = groupInstruction;

                            const groupContent = formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].content`) as string;
                            const groupContentType = formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].content_type`) as ContentType;
                            if (groupContent) {
                                updatedGroup.content = {
                                    type: groupContentType || 'text',
                                    value: groupContent
                                };
                            }

                            // Xử lý given_words
                            const givenWordsText = formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].given_words`) as string;
                            if (givenWordsText) {
                                updatedGroup.given_words = givenWordsText.split('\n').filter(Boolean);
                            } else {
                                updatedGroup.given_words = group.given_words || [];
                            }

                            // Xử lý questions
                            if (group.questions) {
                                updatedGroup.questions = group.questions.map((question, questionIndex) => {
                                    const questionNumber = Number(formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].question_number`));
                                    const questionType = formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].question_type`) as string;
                                    const questionText = formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].question_text`) as string;
                                    const optionsText = formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].options`) as string;
                                    const answerText = formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].answer`) as string;
                                    const explaination = formData.get(`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].explaination`) as string;

                                    const updatedQuestion: Question = {
                                        question_number: questionNumber,
                                        question_type: questionType as QuestionType,
                                        question_text: questionText,
                                        answer: [],
                                        explaination: explaination || question.explaination || ''
                                    };

                                    // Xử lý đáp án dựa trên loại câu hỏi
                                    if (questionType === 'true-false-not-given') {
                                        updatedQuestion.answer = [answerText];
                                    } else if (answerText) {
                                        updatedQuestion.answer = answerText.split('\n').filter(Boolean);
                                    } else {
                                        updatedQuestion.answer = question.answer || [];
                                    }

                                    if (optionsText) {
                                        updatedQuestion.options = optionsText.split('\n').filter(Boolean);
                                    } else if (question.options) {
                                        updatedQuestion.options = question.options;
                                    }

                                    return updatedQuestion;
                                });
                            }

                            return updatedGroup;
                        });
                    }

                    return updatedPassage;
                });
            }

            console.log('Data to update:', updatedData);
            updateTest(test._id, updatedData);
        };

        // Xử lý upload file audio
        const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, passageIndex: number) => {
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
                    setSelectedTest(prev => {
                        if (!prev) return null;
                        const newPassages = [...prev.passages];
                        newPassages[passageIndex] = {
                            ...newPassages[passageIndex],
                            audio_url: data.url
                        };
                        return {
                            ...prev,
                            passages: newPassages
                        };
                    });
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('Lỗi khi upload audio');
            }
        };

        // Xử lý upload ảnh cho content
        const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'passage' | 'group', passageIndex: number, groupIndex?: number) => {
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
                    setSelectedTest(prev => {
                        if (!prev) return null;
                        const newPassages = [...prev.passages];
                        if (type === 'passage') {
                            newPassages[passageIndex] = {
                                ...newPassages[passageIndex],
                                content: {
                                    type: 'image',
                                    value: data.url
                                }
                            };
                        } else if (type === 'group' && groupIndex !== undefined) {
                            newPassages[passageIndex].question_groups[groupIndex] = {
                                ...newPassages[passageIndex].question_groups[groupIndex],
                                content: {
                                    type: 'image',
                                    value: data.url
                                }
                            };
                        }
                        return {
                            ...prev,
                            passages: newPassages
                        };
                    });
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('Lỗi khi upload ảnh');
            }
        };

        return (
            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <Typography variant="h6">Thông tin cơ bản</Typography>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Test Slug"
                            name="test_slug"
                            defaultValue={test.test_slug}
                            required
                        />
                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Loại Test</InputLabel>
                                <Select
                                    name="type"
                                    defaultValue={test.type}
                                    label="Loại Test"
                                    required
                                >
                                    <MenuItem value="reading">Reading</MenuItem>
                                    <MenuItem value="listening">Listening</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Cấp độ</InputLabel>
                                <Select
                                    name="level"
                                    defaultValue={test.level}
                                    label="Cấp độ"
                                    required
                                >
                                    <MenuItem value="academic">Academic</MenuItem>
                                    <MenuItem value="general">General</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                        <TextField
                            fullWidth
                            label="Tiêu đề"
                            name="title"
                            defaultValue={test.title}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Thời gian (phút)"
                            name="duration"
                            type="number"
                            defaultValue={test.duration}
                            required
                        />
                    </Stack>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Danh sách Passages</Typography>
                        <Button 
                            variant="contained" 
                            color="primary"
                            onClick={() => {
                                const newPassage: Passage = {
                                    passage_number: test.passages.length + 1,
                                    title: '',
                                    content: {
                                        type: 'text',
                                        value: ''
                                    },
                                    question_groups: []
                                };
                                setSelectedTest(prev => {
                                    if (!prev) return null;
                                    return {
                                        ...prev,
                                        passages: [...prev.passages, newPassage]
                                    };
                                });
                            }}
                        >
                            Thêm Passage
                        </Button>
                    </Box>

                    <Stack spacing={3}>
                        {test.passages?.map((passage, passageIndex) => (
                            <Box key={passageIndex} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1">
                                            Passage {passage.passage_number}
                                        </Typography>
                                        <Button 
                                            color="error"
                                            onClick={() => {
                                                setSelectedTest(prev => ({
                                                    ...prev!,
                                                    passages: prev!.passages.filter((_, index) => index !== passageIndex)
                                                }));
                                            }}
                                        >
                                            Xóa Passage
                                        </Button>
                                    </Box>

                                    <TextField
                                        fullWidth
                                        label="Tiêu đề Passage"
                                        name={`passages[${passageIndex}].title`}
                                        defaultValue={passage.title}
                                    />

                                    <FormControl fullWidth>
                                        <InputLabel>Loại nội dung</InputLabel>
                                        <Select
                                            name={`passages[${passageIndex}].content_type`}
                                            defaultValue={passage.content?.type || 'text'}
                                            label="Loại nội dung"
                                        >
                                            <MenuItem value="text">Text</MenuItem>
                                            <MenuItem value="image">Image</MenuItem>
                                            <MenuItem value="html">HTML</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {passage.content?.type === 'text' && (
                                        <TextField
                                            fullWidth
                                            label="Nội dung"
                                            name={`passages[${passageIndex}].content`}
                                            defaultValue={passage.content?.value}
                                            multiline
                                            rows={4}
                                        />
                                    )}

                                    {passage.content?.type === 'image' && (
                                        <Box>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'passage', passageIndex)}
                                                style={{ display: 'none' }}
                                                id={`passage-image-upload-${passageIndex}`}
                                            />
                                            <label htmlFor={`passage-image-upload-${passageIndex}`}>
                                                <Button
                                                    variant="contained"
                                                    component="span"
                                                    color="primary"
                                                >
                                                    Upload Ảnh
                                                </Button>
                                            </label>
                                            {passage.content?.value && (
                                                <Box sx={{ mt: 2 }}>
                                                    <Image 
                                                        src={passage.content.value} 
                                                        alt="Passage content" 
                                                        width={800}
                                                        height={600}
                                                        style={{ maxWidth: '100%', height: 'auto' }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    {passage.content?.type === 'html' && (
                                        <TextField
                                            fullWidth
                                            label="HTML Content"
                                            name={`passages[${passageIndex}].content`}
                                            defaultValue={passage.content?.value}
                                            multiline
                                            rows={4}
                                        />
                                    )}

                                    {test.type === 'listening' && (
                                        <Box>
                                            <input
                                                type="file"
                                                accept="audio/*"
                                                onChange={(e) => handleAudioUpload(e, passageIndex)}
                                                style={{ display: 'none' }}
                                                id={`passage-audio-upload-${passageIndex}`}
                                            />
                                            <label htmlFor={`passage-audio-upload-${passageIndex}`}>
                                                <Button
                                                    variant="contained"
                                                    component="span"
                                                    color="primary"
                                                >
                                                    Upload Audio
                                                </Button>
                                            </label>
                                            {passage.audio_url && (
                                                <Box sx={{ mt: 2 }}>
                                                    <audio controls src={passage.audio_url} />
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle2">Question Groups</Typography>
                                        <Button 
                                            variant="contained" 
                                            color="primary"
                                            onClick={() => {
                                                const newGroup: QuestionGroup = {
                                                    group_title: '',
                                                    group_instruction: '',
                                                    content: {
                                                        type: 'text',
                                                        value: ''
                                                    },
                                                    given_words: [],
                                                    questions: []
                                                };
                                                setSelectedTest(prev => {
                                                    if (!prev) return null;
                                                    const updatedPassages = prev.passages.map((p, index) => 
                                                        index === passageIndex 
                                                            ? { ...p, question_groups: [...p.question_groups, newGroup] }
                                                            : p
                                                    );
                                                    return {
                                                        ...prev,
                                                        passages: updatedPassages
                                                    };
                                                });
                                            }}
                                        >
                                            Thêm Nhóm Câu Hỏi
                                        </Button>
                                    </Box>

                                    <Stack spacing={2}>
                                        {passage.question_groups?.map((group, groupIndex) => (
                                            <Box key={groupIndex} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                                <Stack spacing={2}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="subtitle2">Nhóm {groupIndex + 1}</Typography>
                                                        <Button 
                                                            color="error"
                                                            onClick={() => {
                                                                setSelectedTest(prev => ({
                                                                    ...prev!,
                                                                    passages: prev!.passages.map((p, index) => 
                                                                        index === passageIndex 
                                                                            ? { ...p, question_groups: p.question_groups.filter((_, gIndex) => gIndex !== groupIndex) }
                                                                            : p
                                                                    )
                                                                }));
                                                            }}
                                                        >
                                                            Xóa Nhóm
                                                        </Button>
                                                    </Box>

                                                    <TextField
                                                        fullWidth
                                                        label="Tiêu đề nhóm"
                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].group_title`}
                                                        defaultValue={group.group_title}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="Hướng dẫn"
                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].group_instruction`}
                                                        defaultValue={group.group_instruction}
                                                        multiline
                                                        rows={2}
                                                    />

                                                    <FormControl fullWidth>
                                                        <InputLabel>Loại nội dung</InputLabel>
                                                        <Select
                                                            name={`passages[${passageIndex}].question_groups[${groupIndex}].content_type`}
                                                            defaultValue={group.content?.type || 'text'}
                                                            label="Loại nội dung"
                                                        >
                                                            <MenuItem value="text">Text</MenuItem>
                                                            <MenuItem value="image">Image</MenuItem>
                                                            <MenuItem value="html">HTML</MenuItem>
                                                        </Select>
                                                    </FormControl>

                                                    {group.content?.type === 'text' && (
                                                        <TextField
                                                            fullWidth
                                                            label="Nội dung nhóm"
                                                            name={`passages[${passageIndex}].question_groups[${groupIndex}].content`}
                                                            defaultValue={group.content?.value}
                                                            multiline
                                                            rows={2}
                                                        />
                                                    )}

                                                    {group.content?.type === 'image' && (
                                                        <Box>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleImageUpload(e, 'group', passageIndex, groupIndex)}
                                                                style={{ display: 'none' }}
                                                                id={`group-image-upload-${passageIndex}-${groupIndex}`}
                                                            />
                                                            <label htmlFor={`group-image-upload-${passageIndex}-${groupIndex}`}>
                                                                <Button
                                                                    variant="contained"
                                                                    component="span"
                                                                    color="primary"
                                                                >
                                                                    Upload Ảnh
                                                                </Button>
                                                            </label>
                                                            {group.content?.value && (
                                                                <Box sx={{ mt: 2 }}>
                                                                    <Image 
                                                                        src={group.content.value} 
                                                                        alt="Group content" 
                                                                        width={800}
                                                                        height={600}
                                                                        style={{ maxWidth: '100%', height: 'auto' }}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    )}

                                                    {group.content?.type === 'html' && (
                                                        <TextField
                                                            fullWidth
                                                            label="HTML Content"
                                                            name={`passages[${passageIndex}].question_groups[${groupIndex}].content`}
                                                            defaultValue={group.content?.value}
                                                            multiline
                                                            rows={2}
                                                        />
                                                    )}

                                                    <TextField
                                                        fullWidth
                                                        label="Từ cho sẵn (mỗi từ một dòng)"
                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].given_words`}
                                                        defaultValue={group.given_words?.join('\n')}
                                                        multiline
                                                        rows={2}
                                                    />

                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="subtitle2">Questions</Typography>
                                                        <Button 
                                                            variant="contained" 
                                                            color="primary"
                                                            onClick={() => {
                                                                const newQuestion: Question = {
                                                                    question_number: group.questions.length + 1,
                                                                    question_type: 'multiple-choice',
                                                                    question_text: '',
                                                                    answer: [],
                                                                    explaination: '',
                                                                    options: []
                                                                };
                                                                setSelectedTest(prev => {
                                                                    if (!prev) return null;
                                                                    const updatedPassages = prev.passages.map((p, index) => 
                                                                        index === passageIndex 
                                                                            ? {
                                                                                ...p,
                                                                                question_groups: p.question_groups.map((g, gIndex) => 
                                                                                    gIndex === groupIndex 
                                                                                        ? { ...g, questions: [...g.questions, newQuestion] }
                                                                                        : g
                                                                                )
                                                                            }
                                                                            : p
                                                                    );
                                                                    return {
                                                                        ...prev,
                                                                        passages: updatedPassages
                                                                    };
                                                                });
                                                            }}
                                                        >
                                                            Thêm Câu Hỏi
                                                        </Button>
                                                    </Box>

                                                    <Stack spacing={2}>
                                                        {group.questions?.map((question, questionIndex) => (
                                                            <Box key={questionIndex} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                                                <Stack spacing={2}>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <Typography variant="subtitle2">Câu hỏi {questionIndex + 1}</Typography>
                                                                        <Button 
                                                                            color="error"
                                                                            onClick={() => {
                                                                                setSelectedTest(prev => ({
                                                                                    ...prev!,
                                                                                    passages: prev!.passages.map((p, index) => 
                                                                                        index === passageIndex 
                                                                                            ? {
                                                                                                ...p,
                                                                                                question_groups: p.question_groups.map((g, gIndex) => 
                                                                                                    gIndex === groupIndex 
                                                                                                        ? { ...g, questions: g.questions.filter((_, qIndex) => qIndex !== questionIndex) }
                                                                                                        : g
                                                                                                )
                                                                                            }
                                                                                            : p
                                                                                    )
                                                                                }));
                                                                            }}
                                                                        >
                                                                            Xóa Câu Hỏi
                                                                        </Button>
                                                                    </Box>

                                                                    <TextField
                                                                        fullWidth
                                                                        label="Số thứ tự câu hỏi"
                                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].question_number`}
                                                                        type="number"
                                                                        defaultValue={question.question_number}
                                                                    />
                                                                    <FormControl fullWidth>
                                                                        <InputLabel>Loại câu hỏi</InputLabel>
                                                                        <Select
                                                                            name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].question_type`}
                                                                            defaultValue={question.question_type}
                                                                            label="Loại câu hỏi"
                                                                        >
                                                                            <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                                                                            <MenuItem value="fill-in-blank">Fill in Blank</MenuItem>
                                                                            <MenuItem value="matching">Matching</MenuItem>
                                                                            <MenuItem value="true-false-not-given">True/False/Not Given</MenuItem>
                                                                            <MenuItem value="fill-in-blank-optional">Fill in Blank (Optional)</MenuItem>
                                                                            <MenuItem value="map">Map</MenuItem>
                                                                            <MenuItem value="correct-optional">Correct (Optional)</MenuItem>
                                                                        </Select>
                                                                    </FormControl>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Nội dung câu hỏi"
                                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].question_text`}
                                                                        defaultValue={question.question_text}
                                                                        multiline
                                                                        rows={2}
                                                                    />

                                                                    {(question.question_type === 'multiple-choice' || 
                                                                      question.question_type === 'correct-optional' || 
                                                                      question.question_type === 'matching') && (
                                                                        <TextField
                                                                            fullWidth
                                                                            label="Các lựa chọn (mỗi lựa chọn một dòng)"
                                                                            name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].options`}
                                                                            defaultValue={question.options?.join('\n') || ''}
                                                                            multiline
                                                                            rows={4}
                                                                        />
                                                                    )}

                                                                    {question.question_type === 'multiple-choice' && (
                                                                        <FormControl fullWidth>
                                                                            <InputLabel>Đáp án</InputLabel>
                                                                            <Select
                                                                                name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].answer`}
                                                                                value={question.answer[0] || ''}
                                                                                onChange={(e) => {
                                                                                    setSelectedTest(prev => {
                                                                                        if (!prev) return null;
                                                                                        const newPassages = [...prev.passages];
                                                                                        newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex].answer = [e.target.value];
                                                                                        return {
                                                                                            ...prev,
                                                                                            passages: newPassages
                                                                                        };
                                                                                    });
                                                                                }}
                                                                                label="Đáp án"
                                                                            >
                                                                                {(question.options || []).map((option, index) => (
                                                                                    <MenuItem key={index} value={option}>
                                                                                        {option}
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>
                                                                    )}

                                                                    {question.question_type === 'matching' && (
                                                                        <Box>
                                                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Đáp án cho từng cặp</Typography>
                                                                            {(question.options || []).map((option, index) => (
                                                                                <TextField
                                                                                    key={index}
                                                                                    fullWidth
                                                                                    label={`Đáp án cho "${option}"`}
                                                                                    name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].answer[${index}]`}
                                                                                    value={question.answer[index] || ''}
                                                                                    onChange={(e) => {
                                                                                        setSelectedTest(prev => {
                                                                                            if (!prev) return null;
                                                                                            const newPassages = [...prev.passages];
                                                                                            const newAnswer = [...(newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex].answer || [])];
                                                                                            newAnswer[index] = e.target.value;
                                                                                            newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex].answer = newAnswer;
                                                                                            return {
                                                                                                ...prev,
                                                                                                passages: newPassages
                                                                                            };
                                                                                        });
                                                                                    }}
                                                                                    sx={{ mb: 1 }}
                                                                                />
                                                                            ))}
                                                                        </Box>
                                                                    )}

                                                                    {question.question_type === 'true-false-not-given' && (
                                                                        <TextField
                                                                            fullWidth
                                                                            label="Đáp án"
                                                                            name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].answer`}
                                                                            value={question.answer[0] || ''}
                                                                            onChange={(e) => {
                                                                                setSelectedTest(prev => {
                                                                                    if (!prev) return null;
                                                                                    const newPassages = [...prev.passages];
                                                                                    newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex].answer = [e.target.value];
                                                                                    return {
                                                                                        ...prev,
                                                                                        passages: newPassages
                                                                                    };
                                                                                });
                                                                            }}
                                                                            placeholder="Nhập true, false hoặc not given"
                                                                        />
                                                                    )}

                                                                    {(question.question_type === 'fill-in-blank-optional' || 
                                                                      question.question_type === 'map') && (
                                                                        <FormControl fullWidth>
                                                                            <InputLabel>Đáp án</InputLabel>
                                                                            <Select
                                                                                name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].answer`}
                                                                                value={question.answer[0] || ''}
                                                                                onChange={(e) => {
                                                                                    setSelectedTest(prev => {
                                                                                        if (!prev) return null;
                                                                                        const newPassages = [...prev.passages];
                                                                                        newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex].answer = [e.target.value];
                                                                                        return {
                                                                                            ...prev,
                                                                                            passages: newPassages
                                                                                        };
                                                                                    });
                                                                                }}
                                                                                label="Đáp án"
                                                                            >
                                                                                {(group.given_words || []).map((word, index) => (
                                                                                    <MenuItem key={index} value={word}>
                                                                                        {word}
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>
                                                                    )}

                                                                    {question.question_type === 'correct-optional' && (
                                                                        <Box>
                                                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Chọn các đáp án đúng</Typography>
                                                                            {(question.options || []).map((option, index) => (
                                                                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                                    <Checkbox
                                                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].answer[${index}]`}
                                                                                        checked={question.answer.includes(option)}
                                                                                        onChange={(e) => {
                                                                                            setSelectedTest(prev => {
                                                                                                if (!prev) return null;
                                                                                                const newPassages = [...prev.passages];
                                                                                                const currentAnswer = newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex].answer || [];
                                                                                                if (e.target.checked) {
                                                                                                    newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex].answer = [...currentAnswer, option];
                                                                                                } else {
                                                                                                    newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex].answer = currentAnswer.filter(a => a !== option);
                                                                                                }
                                                                                                return {
                                                                                                    ...prev,
                                                                                                    passages: newPassages
                                                                                                };
                                                                                            });
                                                                                        }}
                                                                                    />
                                                                                    <Typography>{option}</Typography>
                                                                                </Box>
                                                                            ))}
                                                                        </Box>
                                                                    )}

                                                                    {(question.question_type === 'fill-in-blank') && (
                                                                        <TextField
                                                                            fullWidth
                                                                            label="Đáp án"
                                                                            name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].answer`}
                                                                            value={question.answer[0] || ''}
                                                                            onChange={(e) => {
                                                                                setSelectedTest(prev => {
                                                                                    if (!prev) return null;
                                                                                    const newPassages = [...prev.passages];
                                                                                    newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex].answer = [e.target.value];
                                                                                    return {
                                                                                        ...prev,
                                                                                        passages: newPassages
                                                                                    };
                                                                                });
                                                                            }}
                                                                        />
                                                                    )}

                                                                    <TextField
                                                                        fullWidth
                                                                        label="Giải thích"
                                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].explaination`}
                                                                        defaultValue={question.explaination || ''}
                                                                        multiline
                                                                        rows={2}
                                                                    />
                                                                </Stack>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </Stack>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Hủy</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Lưu
                    </Button>
                </DialogActions>
            </Box>
        );
    };

    return (
        <Box sx={{ p: 2, lg: { p: 3 } }}>
            <Typography variant="h5" lg={{ variant: "h4" }} component="h1" gutterBottom>
                Quản lý bài test
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error.message || 'Có lỗi xảy ra khi tải danh sách test'}
                </Alert>
            )}

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2, lg: { my: 3 } }}>
                    <CircularProgress />
                </Box>
            )}

            {!isLoading && tests.length === 0 && !error && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Chưa có bài test nào
                </Alert>
            )}

            <Stack spacing={2}>
                {tests && tests.length > 0 ? (
                    tests.map((test) => {
                        console.log('Rendering test:', test);
                        return (
                            <Card key={test._id}>
                                <CardContent>
                                    <Typography variant="h6" component="h2" gutterBottom>
                                        {test.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {test.test_slug}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {test.type} - {test.level} ({test.duration} phút)
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        <IconButton
                                            color="primary"
                                            onClick={() => {
                                                setSelectedTest(test);
                                                setIsEditing(true);
                                                setOpenDialog(true);
                                            }}
                                            size="small"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                        <IconButton
                                            color="warning"
                                            onClick={() => {
                                                setSelectedTest(test);
                                                setIsEditing(true);
                                                setOpenDialog(true);
                                            }}
                                            size="small"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => deleteTest(test._id)}
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : null}
            </Stack>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {isEditing ? "Chỉnh sửa test" : "Chi tiết test"}
                </DialogTitle>
                <DialogContent>
                    {selectedTest && (
                        isEditing ? renderTestForm(selectedTest) : renderTestForm(selectedTest)
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}