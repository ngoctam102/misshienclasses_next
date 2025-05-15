'use client';
import { useState, useCallback } from "react";
import useSWR from 'swr';
import debounce from 'lodash/debounce';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TableSortLabel,
    Box,
    TextField,
    InputAdornment,
    Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface StudentScore {
    name: string;
    email: string;
    role: string;
    test_name: string;
    test_type: string;
    score: number;
    duration: number;
    submit_date: string;
}

type Order = 'asc' | 'desc';

interface HeadCell {
    id: keyof StudentScore;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    { id: 'name', numeric: false, label: 'Tên' },
    { id: 'email', numeric: false, label: 'Email' },
    { id: 'role', numeric: false, label: 'Vai trò' },
    { id: 'test_name', numeric: false, label: 'Tên bài kiểm tra' },
    { id: 'test_type', numeric: false, label: 'Loại bài kiểm tra' },
    { id: 'score', numeric: true, label: 'Điểm số' },
    { id: 'duration', numeric: false, label: 'Thời gian làm bài' },
    { id: 'submit_date', numeric: false, label: 'Ngày nộp' },
];

const fetcher = (url: string) => fetch(url, {
    credentials: 'include',
}).then(res => res.json());

export default function StudentTestResult() {
    const [order, setOrder] = useState<Order>('desc');
    const [orderBy, setOrderBy] = useState<keyof StudentScore>('submit_date');
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const debouncedSetSearch = useCallback(
        debounce((value: string) => {
            setDebouncedSearchTerm(value);
            setPage(0);
        }, 1000),
        []
    );

    const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        sort: orderBy,
        order: order,
        search: debouncedSearchTerm
    });

    const { data, error, isLoading } = useSWR(
        `${process.env.NEXT_PUBLIC_ALL_STUDENTS_TEST_SCORE_API_URL}?${params}`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

    const handleRequestSort = (property: keyof StudentScore) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    if (isLoading) return <div>Đang tải...</div>;
    if (error) return <div>Lỗi: {error.message}</div>;
    if (!data?.success) return <div>Không có dữ liệu</div>;

    const rows = data.data;

    return (
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Tìm kiếm bất cứ thông tin nào..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        debouncedSetSearch(e.target.value);
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 2 }}
                />
                <TableContainer>
                    <Table
                        sx={{ minWidth: 750 }}
                        aria-labelledby="tableTitle"
                        size="medium"
                    >
                        <TableHead>
                            <TableRow>
                                {headCells.map((headCell) => (
                                    <TableCell
                                        key={headCell.id}
                                        align={headCell.numeric ? 'right' : 'left'}
                                        sortDirection={orderBy === headCell.id ? order : false}
                                    >
                                        <TableSortLabel
                                            active={orderBy === headCell.id}
                                            direction={orderBy === headCell.id ? order : 'asc'}
                                            onClick={() => handleRequestSort(headCell.id)}
                                        >
                                            {headCell.label}
                                        </TableSortLabel>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row: StudentScore, index: number) => {
                                const studentTimeTestTaken = Math.floor(row.duration/60) + ' phút ' + (row.duration%60) + ' giây';
                                return (
                                    <TableRow
                                        hover
                                        key={index}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>{row.email}</TableCell>
                                        <TableCell>{row.role}</TableCell>
                                        <TableCell>{row.test_name}</TableCell>
                                        <TableCell>{row.test_type}</TableCell>
                                        <TableCell align="right">{row.score}</TableCell>
                                        <TableCell>{studentTimeTestTaken}</TableCell>
                                        <TableCell>{new Date(row.submit_date).toLocaleString('vi-VN', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            onClick={() => setPage(page - 1)}
                            disabled={!data.pagination.hasPrevPage}
                        >
                            Trang trước
                        </Button>
                        <Button
                            onClick={() => setPage(page + 1)}
                            disabled={!data.pagination.hasNextPage}
                        >
                            Trang sau
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>Trang {data.pagination.page} / {data.pagination.totalPages}</span>
                        <span>(Tổng số: {data.pagination.total} bản ghi)</span>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}