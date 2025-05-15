import { useState } from "react";
import useSWR from "swr";
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
    Divider
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon
} from "@mui/icons-material";
import { Test as BaseTest, TestType, TestLevel } from "@/types/test";

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

    // Xem chi tiết một test
    const viewTest = async (testId: string) => {
        try {
            console.log('Fetching test with ID:', testId);
            const response = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL}/by-id/${testId}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Không thể lấy thông tin test');
            }
            
            const data = await response.json();
            console.log('Test data received:', data);
            
            // Kiểm tra xem data có đúng format không
            if (data.success && data.data) {
                setSelectedTest(data.data);
            } else {
                setSelectedTest(data);
            }
            
            setOpenDialog(true);
        } catch (error) {
            console.error('Lỗi khi xem chi tiết test:', error);
        }
    };

    // Cập nhật test
    const updateTest = async (testId: string, updatedData: Partial<Test>) => {
        try {
            console.log('Data to update:', updatedData);

            const response = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL}/by-id/${testId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể cập nhật test');
            }
            
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

    const renderTestForm = (test: Test) => (
        <Box component="form" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const updatedData: Partial<Test> = {};
            
            // Chỉ lấy những trường được chỉnh sửa
            if (formData.get("test_slug") !== test.test_slug) {
                updatedData.test_slug = formData.get("test_slug") as string;
            }
            if (formData.get("type") !== test.type) {
                updatedData.type = formData.get("type") as TestType;
            }
            if (formData.get("level") !== test.level) {
                updatedData.level = formData.get("level") as TestLevel;
            }
            if (formData.get("title") !== test.title) {
                updatedData.title = formData.get("title") as string;
            }
            if (Number(formData.get("duration")) !== test.duration) {
                updatedData.duration = Number(formData.get("duration"));
            }

            console.log('Data to update:', updatedData);
            updateTest(test._id, updatedData);
        }}>
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

                <Typography variant="h6">Danh sách Passages</Typography>
                <Stack spacing={3}>
                    {test.passages?.map((passage, passageIndex) => (
                        <Box key={passageIndex} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Stack spacing={2}>
                                <Typography variant="subtitle1">
                                    Passage {passage.passage_number}
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Tiêu đề Passage"
                                    name={`passages[${passageIndex}].title`}
                                    defaultValue={passage.title}
                                />
                                <TextField
                                    fullWidth
                                    label="Nội dung"
                                    name={`passages[${passageIndex}].content`}
                                    defaultValue={passage.content?.value}
                                    multiline
                                    rows={4}
                                />
                                {passage.audio_url && (
                                    <TextField
                                        fullWidth
                                        label="URL Audio"
                                        name={`passages[${passageIndex}].audio_url`}
                                        defaultValue={passage.audio_url}
                                    />
                                )}

                                <Typography variant="subtitle2" sx={{ mt: 2 }}>Question Groups</Typography>
                                <Stack spacing={2}>
                                    {passage.question_groups?.map((group, groupIndex) => (
                                        <Box key={groupIndex} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Stack spacing={2}>
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
                                                {group.content && (
                                                    <TextField
                                                        fullWidth
                                                        label="Nội dung nhóm"
                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].content`}
                                                        defaultValue={group.content.value}
                                                        multiline
                                                        rows={2}
                                                    />
                                                )}

                                                <Typography variant="subtitle2">Questions</Typography>
                                                <Stack spacing={2}>
                                                    {group.questions?.map((question, questionIndex) => (
                                                        <Box key={questionIndex} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                                            <Stack spacing={2}>
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
                                                                {question.options && (
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Các lựa chọn (mỗi lựa chọn một dòng)"
                                                                        name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].options`}
                                                                        defaultValue={question.options.join('\n')}
                                                                        multiline
                                                                        rows={4}
                                                                    />
                                                                )}
                                                                <TextField
                                                                    fullWidth
                                                                    label="Đáp án (mỗi đáp án một dòng)"
                                                                    name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].answer`}
                                                                    defaultValue={question.answer.join('\n')}
                                                                    multiline
                                                                    rows={2}
                                                                />
                                                                <TextField
                                                                    fullWidth
                                                                    label="Giải thích"
                                                                    name={`passages[${passageIndex}].question_groups[${groupIndex}].questions[${questionIndex}].explaination`}
                                                                    defaultValue={question.explaination}
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

    const renderTestDetails = (test: Test) => (
        <>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Thông tin cơ bản
                    </Typography>
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2">Test Slug:</Typography>
                                <Typography paragraph>{test.test_slug}</Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2">Loại Test:</Typography>
                                <Typography paragraph>{test.type}</Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2">Cấp độ:</Typography>
                                <Typography paragraph>{test.level}</Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2">Thời gian:</Typography>
                                <Typography paragraph>{test.duration} phút</Typography>
                            </Box>
                        </Stack>
                        <Box>
                            <Typography variant="subtitle2">Tiêu đề:</Typography>
                            <Typography paragraph>{test.title}</Typography>
                        </Box>
                    </Stack>
                </Box>
            </Stack>

            <DialogActions>
                <Button onClick={handleCloseDialog}>Đóng</Button>
                <Button
                    onClick={() => {
                        setIsEditing(true);
                    }}
                    variant="contained"
                    color="primary"
                >
                    Chỉnh sửa
                </Button>
            </DialogActions>
        </>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Quản lý bài test
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error.message || 'Có lỗi xảy ra khi tải danh sách test'}
                </Alert>
            )}

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            {!isLoading && tests.length === 0 && !error && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Chưa có bài test nào
                </Alert>
            )}

            <Stack spacing={3}>
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
                                            onClick={() => viewTest(test._id)}
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
                ) : (
                    <Typography>Không có bài test nào</Typography>
                )}
            </Stack>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {isEditing ? "Chỉnh sửa test" : "Chi tiết test"}
                </DialogTitle>
                <DialogContent>
                    {selectedTest && (
                        isEditing ? renderTestForm(selectedTest) : renderTestDetails(selectedTest)
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}