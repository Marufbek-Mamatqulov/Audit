import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { User } from './authSlice';

interface UserState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async () => {
    const response = await api.get('/auth/users/');
    return response.data;
  }
);

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData: Partial<User>) => {
    const response = await api.patch('/auth/profile/', userData);
    return response.data;
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (passwords: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => {
    const response = await api.post('/auth/change-password/', passwords);
    return response.data;
  }
);

export const createUser = createAsyncThunk(
  'user/createUser',
  async (userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role: string;
    department?: number;
    phone?: string;
  }) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ id, userData }: { id: number; userData: Partial<User> }) => {
    const response = await api.patch(`/auth/users/${id}/`, userData);
    return response.data;
  }
);

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (id: number) => {
    await api.delete(`/auth/users/${id}/`);
    return id;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      
      // Fetch profile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      
      // Create user
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload.user);
      })
      
      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      
      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.id !== action.payload);
      });
  },
});

export const { clearError, setCurrentUser } = userSlice.actions;
export default userSlice.reducer;
