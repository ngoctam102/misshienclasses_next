import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
  Box,
  FormHelperText,
  CircularProgress,
  Pagination,
  Stack,
  SelectChangeEvent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useDebounce } from '@/hooks/useDebounce';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'editor';
  isApproved: boolean;
  hasAttemptedLogin: boolean;
  approvedAt?: Date;
  lastLoginAt?: Date;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FormValues {
  email: string;
  name: string;
  password?: string;
  role: 'student' | 'admin' | 'editor';
  isApproved: boolean;
  hasAttemptedLogin: boolean;
}

export default function ManageUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      email: '',
      name: '',
      password: '',
      role: 'student',
      isApproved: false,
      hasAttemptedLogin: false,
    }
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_ALL_USER_API_URL}?page=${page}&limit=${limit}&sort=${sort}&order=${order}&search=${debouncedSearch}`;
      console.log('Fetching users from URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      } else {
        console.error('API Error:', data);
        alert('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      alert('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleCreate = () => {
    setEditingUser(null);
    reset({
      email: '',
      name: '',
      password: '',
      role: 'student',
      isApproved: false,
      hasAttemptedLogin: false,
    });
    setModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    reset({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
      isApproved: user.isApproved,
      hasAttemptedLogin: user.hasAttemptedLogin,
    });
    setModalOpen(true);
  };

  const handleView = (user: User) => {
    setViewingUser(user);
    setViewModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DELETE_USER_API_URL}/${userId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) {
          alert('Lỗi khi gọi api xoá người dùng');
          return;
        }
        const data = await response.json();
        if (data.success) {
          alert(data.message);
          fetchUsers();
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert('Lỗi handleDelete: ' + error);
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (editingUser) {
        const updateData = {
          email: data.email,
          name: data.name,
          role: data.role,
          isApproved: data.isApproved,
          hasAttemptedLogin: data.hasAttemptedLogin,
          ...(data.password && { password: data.password }),
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_UPDATE_USER_API_URL}/${editingUser._id}`, {
          method: 'PATCH',
          headers,
          credentials: 'include',
          body: JSON.stringify(updateData),
        });
        const responseData = await response.json();
        if (!response.ok) {
          alert(`Lỗi khi cập nhật người dùng: ${responseData.message || JSON.stringify(responseData)}`);
          return;
        }
        if (responseData.success) {
          alert(responseData.message);
          setModalOpen(false);
          fetchUsers();
        } else {
          alert(responseData.message);
        }
      } else {
        const createData = {
          email: data.email,
          name: data.name,
          password: data.password,
          role: data.role,
          isApproved: data.isApproved,
          hasAttemptedLogin: data.hasAttemptedLogin,
        };

        const response = await fetch(process.env.NEXT_PUBLIC_ADMIN_CREATE_USER_API_URL!, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(createData),
        });
        const responseData = await response.json();
        if (!response.ok) {
          alert(`Lỗi khi tạo người dùng: ${responseData.message || JSON.stringify(responseData)}`);
          return;
        }
        if (responseData.success) {
          alert(responseData.message);
          setModalOpen(false);
          fetchUsers();
        } else {
          alert(responseData.message);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra: ' + error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Tạo mới người dùng
        </Button>

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Tìm kiếm"
            variant="outlined"
            value={searchInput}
            onChange={handleSearchChange}
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
              <MenuItem value="name">Tên</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="role">Vai trò</MenuItem>
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
        </Stack>
      </Box>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Trạng thái đăng nhập</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.isApproved ? 'Đã duyệt' : 'Chưa duyệt'}</TableCell>
                  <TableCell>{user.hasAttemptedLogin ? 'Đã đăng nhập' : 'Chưa đăng nhập'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleView(user)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleEdit(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(user._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {pagination && pagination.totalPages > 0 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination 
            count={pagination.totalPages} 
            page={page} 
            onChange={handlePageChange}
            color="primary"
            size="medium"
          />
        </Box>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>
          {editingUser ? 'Chỉnh sửa người dùng' : 'Tạo mới người dùng'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Email là bắt buộc',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email không hợp lệ'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Tên là bắt buộc',
                  minLength: {
                    value: 2,
                    message: 'Tên phải có ít nhất 2 ký tự'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tên"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                rules={{
                  required: !editingUser ? 'Mật khẩu là bắt buộc' : false,
                  minLength: {
                    value: 6,
                    message: 'Mật khẩu phải có ít nhất 6 ký tự'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Mật khẩu mới"
                    type="password"
                    error={!!errors.password}
                    helperText={errors.password?.message || (editingUser ? "Để trống nếu không muốn thay đổi mật khẩu" : "Nhập mật khẩu")}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="role"
                control={control}
                rules={{ required: 'Vai trò là bắt buộc' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.role}>
                    <InputLabel>Vai trò</InputLabel>
                    <Select
                      {...field}
                      label="Vai trò"
                    >
                      <MenuItem value="student">Học viên</MenuItem>
                      <MenuItem value="admin">Quản trị viên</MenuItem>
                      <MenuItem value="editor">Biên tập viên</MenuItem>
                    </Select>
                    {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              <Controller
                name="isApproved"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái duyệt</InputLabel>
                    <Select
                      {...field}
                      label="Trạng thái duyệt"
                      value={field.value ? 'true' : 'false'}
                      onChange={(e) => field.onChange(e.target.value === 'true')}
                    >
                      <MenuItem value="true">Đã duyệt</MenuItem>
                      <MenuItem value="false">Chưa duyệt</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="hasAttemptedLogin"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái đăng nhập</InputLabel>
                    <Select
                      {...field}
                      label="Trạng thái đăng nhập"
                      value={field.value ? 'true' : 'false'}
                      onChange={(e) => field.onChange(e.target.value === 'true')}
                    >
                      <MenuItem value="true">Đã đăng nhập</MenuItem>
                      <MenuItem value="false">Chưa đăng nhập</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        <DialogTitle>Thông tin người dùng</DialogTitle>
        <DialogContent>
          {viewingUser && (
            <Box sx={{ pt: 2 }}>
              <Typography><strong>Email:</strong> {viewingUser.email}</Typography>
              <Typography><strong>Tên:</strong> {viewingUser.name}</Typography>
              <Typography><strong>Vai trò:</strong> {viewingUser.role}</Typography>
              <Typography><strong>Trạng thái duyệt:</strong> {viewingUser.isApproved ? 'Đã duyệt' : 'Chưa duyệt'}</Typography>
              <Typography><strong>Đã đăng nhập:</strong> {viewingUser.hasAttemptedLogin ? 'Có' : 'Chưa'}</Typography>
              {viewingUser.approvedAt && (
                <Typography><strong>Ngày duyệt:</strong> {new Date(viewingUser.approvedAt).toLocaleDateString()}</Typography>
              )}
              {viewingUser.lastLoginAt && (
                <Typography><strong>Lần đăng nhập cuối:</strong> {new Date(viewingUser.lastLoginAt).toLocaleDateString()}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}