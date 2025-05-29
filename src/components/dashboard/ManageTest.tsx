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
    Checkbox,
    Pagination
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon
} from "@mui/icons-material";
import { Test as BaseTest, TestType, TestLevel, Passage, QuestionGroup, Question, ContentType } from "@/types/test";
import { useDebounce } from "@/hooks/useDebounce";
import { SelectChangeEvent } from "@mui/material";
import TiptapEditor from '../editor/TiptapEditor';

// Mở rộng interface Test để thêm _id
interface Test extends BaseTest {
    _id: string;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface ApiResponse {
    success: boolean;
    data: Test[];
    pagination: PaginationData;
}

interface ApiError extends Error {
    info?: Record<string, unknown>;
    status?: number;
}

interface FormData extends Omit<Test, '_id'> {
    passages: Array<Omit<Passage, 'content'> & {
        content?: {
            type: 'text' | 'image' | 'html';
            value?: string;
        };
    }>;
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
    return response;
};

export default function ManageTest() {
    const [selectedTest, setSelectedTest] = useState<Test | null>(null);
    const [formData, setFormData] = useState<FormData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [sort, setSort] = useState('createdAt');
    const [order, setOrder] = useState('desc');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);

    const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
        `${process.env.NEXT_PUBLIC_ALL_TESTS_API_URL}?page=${page}&limit=${limit}&sort=${sort}&order=${order}&search=${debouncedSearch}`,
        fetcher
    );

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(event.target.value);
        setPage(1);
    };

    const handleSortChange = (event: SelectChangeEvent) => {
        setSort(event.target.value);
        setPage(1);
    };

    const handleOrderChange = (event: SelectChangeEvent) => {
        setOrder(event.target.value);
        setPage(1);
    };

    console.log('Current tests state:', data);
    console.log('Tests length:', data?.data.length);
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

            // Loại bỏ các trường không mong muốn
            const cleanedData = removeUnwantedFields(updatedData);
            console.log('Final data to send:', cleanedData);

            const response = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL}/${testId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(cleanedData)
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

    const handleOpenEdit = (test: Test) => {
        setSelectedTest(test);
        setFormData({
            test_slug: test.test_slug,
            type: test.type,
            level: test.level,
            title: test.title,
            duration: test.duration,
            passages: test.passages.map(passage => ({
                ...passage,
                content: passage.content ? {
                    type: passage.content.type,
                    value: passage.content.value || ''
                } : undefined,
                question_groups: passage.question_groups.map(group => ({
                    ...group,
                    content: group.content ? {
                        type: group.content.type,
                        value: group.content.value || ''
                    } : undefined,
                    questions: group.questions.map(question => ({
                        ...question,
                        answer: [...(question.answer || [])],
                        options: [...(question.options || [])]
                    }))
                }))
            }))
        });
        setIsEditing(true);
        setOpenDialog(true);
    };

    const handleInputChange = (field: keyof FormData, value: FormData[keyof FormData]) => {
        setFormData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [field]: value
            };
        });
    };

    const handlePassageChange = (passageIndex: number, field: keyof Passage, value: Passage[keyof Passage]) => {
        setFormData(prev => {
            if (!prev) return null;
            const newPassages = [...prev.passages];
            newPassages[passageIndex] = {
                ...newPassages[passageIndex],
                [field]: value
            };
            return {
                ...prev,
                passages: newPassages
            };
        });
    };

    const handleQuestionGroupChange = (passageIndex: number, groupIndex: number, field: keyof QuestionGroup, value: QuestionGroup[keyof QuestionGroup]) => {
        setFormData(prev => {
            if (!prev) return null;
            const newPassages = [...prev.passages];
            newPassages[passageIndex].question_groups[groupIndex] = {
                ...newPassages[passageIndex].question_groups[groupIndex],
                [field]: value
            };
            return {
                ...prev,
                passages: newPassages
            };
        });
    };

    const handleQuestionChange = (passageIndex: number, groupIndex: number, questionIndex: number, field: keyof Question, value: Question[keyof Question]) => {
        setFormData(prev => {
            if (!prev) return null;
            const newPassages = [...prev.passages];
            newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex] = {
                ...newPassages[passageIndex].question_groups[groupIndex].questions[questionIndex],
                [field]: value
            };
            return {
                ...prev,
                passages: newPassages
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedTest || !formData) return;

        try {
            await updateTest(selectedTest._id, formData);
            setOpenDialog(false);
            setIsEditing(false);
            setFormData(null);
        } catch (error) {
            console.error('Lỗi khi cập nhật test:', error);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTest(null);
        setFormData(null);
        setIsEditing(false);
    };

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
                setFormData(prev => {
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
                setFormData(prev => {
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

    const renderTestForm = (test: Test) => {
        if (!formData) return null;

        return (
            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <Typography variant="h6">Thông tin cơ bản</Typography>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Test Slug"
                            name="test_slug"
                            value={formData.test_slug}
                            onChange={(e) => handleInputChange('test_slug', e.target.value)}
                            required
                        />
                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Loại Test</InputLabel>
                                <Select
                                    name="type"
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value as TestType)}
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
                                    value={formData.level}
                                    onChange={(e) => handleInputChange('level', e.target.value as TestLevel)}
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
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Thời gian (phút)"
                            name="duration"
                            type="number"
                            value={formData.duration}
                            onChange={(e) => handleInputChange('duration', Number(e.target.value))}
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
                                const newPassage: Omit<Passage, 'content'> & {
                                    content?: {
                                        type: 'text' | 'image' | 'html';
                                        value?: string;
                                    };
                                } = {
                                    passage_number: formData.passages.length + 1,
                                    title: '',
                                    content: {
                                        type: 'text',
                                        value: ''
                                    },
                                    question_groups: []
                                };
                                setFormData(prev => ({
                                    ...prev!,
                                    passages: [...prev!.passages, newPassage]
                                }));
                            }}
                        >
                            Thêm Passage
                        </Button>
                    </Box>

                    <Stack spacing={3}>
                        {formData.passages.map((passage, passageIndex) => (
                            <Box key={passageIndex} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1">
                                            Passage {passage.passage_number}
                                        </Typography>
                                        <Button 
                                            color="error"
                                            onClick={() => {
                                                setFormData(prev => ({
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
                                        value={passage.title}
                                        onChange={(e) => handlePassageChange(passageIndex, 'title', e.target.value)}
                                    />

                                    <FormControl fullWidth>
                                        <InputLabel>Loại nội dung</InputLabel>
                                        <Select
                                            name={`passages[${passageIndex}].content_type`}
                                            value={passage.content?.type || 'text'}
                                            onChange={(e) => handlePassageChange(passageIndex, 'content', { 
                                                type: e.target.value as 'text' | 'image' | 'html',
                                                value: passage.content?.value || ''
                                            })}
                                            label="Loại nội dung"
                                        >
                                            <MenuItem value="text">Text</MenuItem>
                                            <MenuItem value="image">Image</MenuItem>
                                            <MenuItem value="html">HTML</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {(!passage.content || passage.content.type === 'text') && (
                                        <TiptapEditor
                                            content={passage.content?.value || ''}
                                            onChange={(newContent) => {
                                                handlePassageChange(passageIndex, 'content', {
                                                    type: 'text',
                                                    value: newContent
                                                });
                                            }}
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
                                            value={passage.content?.value}
                                            multiline
                                            rows={4}
                                            onChange={(e) => handlePassageChange(passageIndex, 'content', { type: 'html', value: e.target.value })}
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

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">Audio URL</label>
                                        <input
                                            type="text"
                                            name={`passages[${passageIndex}].audio_url`}
                                            value={passage.audio_url}
                                            onChange={(e) => handlePassageChange(passageIndex, 'audio_url', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                        />
                                    </div>

                                    <TextField
                                        fullWidth
                                        label="Transcript"
                                        name={`passages[${passageIndex}].transcript`}
                                        value={passage.transcript}
                                        multiline
                                        rows={4}
                                        onChange={(e) => handlePassageChange(passageIndex, 'transcript', e.target.value)}
                                        placeholder="Nhập transcript cho bài nghe"
                                    />

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
                                                setFormData(prev => ({
                                                    ...prev!,
                                                    passages: prev!.passages.map((p, index) => 
                                                        index === passageIndex 
                                                            ? { ...p, question_groups: [...p.question_groups, newGroup] }
                                                            : p
                                                    )
                                                }));
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
                                                                setFormData(prev => ({
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
                                                        value={group.group_title}
                                                        onChange={(e) => handleQuestionGroupChange(passageIndex, groupIndex, 'group_title', e.target.value)}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="Hướng dẫn"
                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].group_instruction`}
                                                        value={group.group_instruction}
                                                        multiline
                                                        rows={2}
                                                        onChange={(e) => handleQuestionGroupChange(passageIndex, groupIndex, 'group_instruction', e.target.value)}
                                                    />

                                                    <FormControl fullWidth>
                                                        <InputLabel>Loại nội dung</InputLabel>
                                                        <Select
                                                            name={`passages[${passageIndex}].question_groups[${groupIndex}].content_type`}
                                                            value={group.content?.type || 'text'}
                                                            onChange={(e) => handleQuestionGroupChange(passageIndex, groupIndex, 'content', { 
                                                                type: e.target.value as ContentType, 
                                                                value: group.content?.value || '' 
                                                            })}
                                                            label="Loại nội dung"
                                                        >
                                                            <MenuItem value="text">Text</MenuItem>
                                                            <MenuItem value="image">Image</MenuItem>
                                                            <MenuItem value="html">HTML</MenuItem>
                                                        </Select>
                                                    </FormControl>

                                                    {(!group.content || group.content.type === 'text') && (
                                                        <TiptapEditor
                                                            content={group.content?.value || ''}
                                                            onChange={(newContent) => {
                                                                handleQuestionGroupChange(passageIndex, groupIndex, 'content', {
                                                                    type: 'text',
                                                                    value: newContent
                                                                });
                                                            }}
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
                                                            value={group.content?.value}
                                                            multiline
                                                            rows={2}
                                                            onChange={(e) => handleQuestionGroupChange(passageIndex, groupIndex, 'content', { type: 'html', value: e.target.value })}
                                                        />
                                                    )}

                                                    <TextField
                                                        fullWidth
                                                        label="Từ cho sẵn (mỗi từ một dòng)"
                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].given_words`}
                                                        value={group.given_words?.join('\n')}
                                                        multiline
                                                        rows={2}
                                                        onChange={(e) => handleQuestionGroupChange(passageIndex, groupIndex, 'given_words', e.target.value.split('\n'))}
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
                                                                setFormData(prev => ({
                                                                    ...prev!,
                                                                    passages: prev!.passages.map((p, index) => 
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
                                                                    )
                                                                }));
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
                                                                                setFormData(prev => ({
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
                                                                        value={question.question_number}
                                                                        onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'question_number', e.target.value)}
                                                                    />
                                                                    <FormControl fullWidth>
                                                                        <InputLabel>Loại câu hỏi</InputLabel>
                                                                        <Select
                                                                            name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].question_type`}
                                                                            value={question.question_type}
                                                                            onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'question_type', e.target.value)}
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
                                                                        value={question.question_text}
                                                                        multiline
                                                                        rows={2}
                                                                        onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'question_text', e.target.value)}
                                                                    />

                                                                    {(question.question_type === 'multiple-choice' || 
                                                                      question.question_type === 'correct-optional' || 
                                                                      question.question_type === 'matching') && (
                                                                        <TextField
                                                                            fullWidth
                                                                            label="Các lựa chọn (mỗi lựa chọn một dòng)"
                                                                            name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].options`}
                                                                            value={question.options?.join('\n') || ''}
                                                                            multiline
                                                                            rows={4}
                                                                            onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'options', e.target.value.split('\n'))}
                                                                        />
                                                                    )}

                                                                    {question.question_type === 'multiple-choice' && (
                                                                        <FormControl fullWidth>
                                                                            <InputLabel>Đáp án</InputLabel>
                                                                            <Select
                                                                                name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].answer`}
                                                                                value={question.answer[0] || ''}
                                                                                onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'answer', [e.target.value])}
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
                                                                                    onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'answer', [...(question.answer || []), e.target.value])}
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
                                                                            onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'answer', [e.target.value])}
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
                                                                                onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'answer', [e.target.value])}
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
                                                                                        onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'answer', e.target.checked ? [...question.answer, option] : question.answer.filter((a) => a !== option))}
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
                                                                            onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'answer', [e.target.value])}
                                                                        />
                                                                    )}

                                                                    <TextField
                                                                        fullWidth
                                                                        label="Giải thích"
                                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].explaination`}
                                                                        value={question.explaination || ''}
                                                                        multiline
                                                                        rows={2}
                                                                        onChange={(e) => handleQuestionChange(passageIndex, groupIndex, questionIndex, 'explaination', e.target.value)}
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
        <Box sx={{ p: { xs: 2, lg: 3 } }}>
            <Typography 
                variant="h5" 
                component="h1" 
                gutterBottom
                sx={{ 
                    fontSize: { xs: '1.25rem', lg: '1.5rem' },
                    fontWeight: 'bold'
                }}
            >
                Quản lý bài test
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
                <Box display="flex" gap={{ xs: 1, sm: 2 }} alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField
                        label="Tìm kiếm"
                        variant="outlined"
                        value={searchInput}
                        onChange={handleSearchChange}
                        fullWidth
                        size="small"
                    />
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Sắp xếp theo</InputLabel>
                        <Select
                            value={sort}
                            label="Sắp xếp theo"
                            onChange={handleSortChange}
                        >
                            <MenuItem value="createdAt">Ngày tạo</MenuItem>
                            <MenuItem value="title">Tiêu đề</MenuItem>
                            <MenuItem value="type">Loại test</MenuItem>
                            <MenuItem value="level">Cấp độ</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Thứ tự</InputLabel>
                        <Select
                            value={order}
                            label="Thứ tự"
                            onChange={handleOrderChange}
                        >
                            <MenuItem value="desc">Mới nhất</MenuItem>
                            <MenuItem value="asc">Cũ nhất</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error.message || 'Có lỗi xảy ra khi tải danh sách test'}
                </Alert>
            )}

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: { xs: 2, lg: 3 } }}>
                    <CircularProgress />
                </Box>
            )}

            {!isLoading && data?.data.length === 0 && !error && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Chưa có bài test nào
                </Alert>
            )}

            <Stack spacing={2}>
                {data && data.data.length > 0 ? (
                    data.data.map((test) => {
                        console.log('Rendering test:', test);
                        return (
                            <Card key={test._id}>
                                <CardContent>
                                    <Typography 
                                        variant="h6" 
                                        component="h2" 
                                        gutterBottom
                                        sx={{ 
                                            fontSize: { xs: '1rem', lg: '1.25rem' },
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {test.title}
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary" 
                                        sx={{ 
                                            mb: 1,
                                            fontSize: { xs: '0.75rem', lg: '0.875rem' }
                                        }}
                                    >
                                        {test.test_slug}
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary" 
                                        sx={{ 
                                            mb: 2,
                                            fontSize: { xs: '0.75rem', lg: '0.875rem' }
                                        }}
                                    >
                                        {test.type} - {test.level} ({test.duration} phút)
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        <IconButton
                                            color="primary"
                                            onClick={() => {
                                                handleOpenEdit(test);
                                            }}
                                            size="small"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                        <IconButton
                                            color="warning"
                                            onClick={() => {
                                                handleOpenEdit(test);
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

            {data?.pagination && (
                <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination 
                        count={data.pagination.totalPages} 
                        page={page} 
                        onChange={handlePageChange}
                        color="primary"
                        size="medium"
                    />
                </Box>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {isEditing ? "Chỉnh sửa test" : "Chi tiết test"}
                </DialogTitle>
                <DialogContent>
                    {selectedTest && renderTestForm(selectedTest)}
                </DialogContent>
            </Dialog>
        </Box>
    );
}