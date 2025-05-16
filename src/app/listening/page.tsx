'use client';
import ListeningTests from "@/components/ListeningTests";
import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { 
    Container, 
    Typography, 
    CircularProgress, 
    Alert,
    Pagination,
    TextField,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack,
    SelectChangeEvent
} from '@mui/material';

// Custom hook for debounce
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

interface TestListItem {
    test_slug: string;
    title: string;
    level: string;
    duration: number;
    type: string;
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
    data: TestListItem[];
    pagination: PaginationData;
}

export default function ListeningPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [sort, setSort] = useState('createdAt');
    const [order, setOrder] = useState('desc');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500); // 500ms delay

    const fetcher = (url: string) => fetch(url, {
        credentials: 'include'
    }).then(res => res.json());

    const { data, isLoading, error } = useSWR<ApiResponse>(
        `${process.env.NEXT_PUBLIC_LISTENING_API_URL}?page=${page}&limit=${limit}&sort=${sort}&order=${order}&search=${debouncedSearch}`,
        fetcher,
        {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

    useEffect(() => {
        if (data) {
            console.log('API Response:', data);
        }
    }, [data]);

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

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Alert severity="error">Error: {error.message}</Alert>
            </Box>
        );
    }

    if (!data || !data.success) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Alert severity="info">No data available</Alert>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                Listening Tests
            </Typography>

            <Stack spacing={2} sx={{ mb: 4 }}>
                <Box display="flex" gap={2} alignItems="center">
                    <TextField
                        label="Tìm kiếm"
                        variant="outlined"
                        value={searchInput}
                        onChange={handleSearchChange}
                        fullWidth
                    />
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Sắp xếp theo</InputLabel>
                        <Select
                            value={sort}
                            label="Sắp xếp theo"
                            onChange={handleSortChange}
                        >
                            <MenuItem value="createdAt">Ngày tạo</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 120 }}>
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

            <ListeningTests tests={data.data} />

            {data.pagination && (
                <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination 
                        count={data.pagination.totalPages} 
                        page={page} 
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                    />
                </Box>
            )}
        </Container>
    );
}
