import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user';
  department: number | null;
  department_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const token = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

const initialState: AuthState = {
  isAuthenticated: !!token, // token mavjud bo'lsa true
  user: null,
  token,
  refreshToken,
  loading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    phone?: string;
    department?: number;
  }) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    if (state.auth.refreshToken) {
      await api.post('/auth/logout/', {
        refresh_token: state.auth.refreshToken,
      });
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    const response = await api.post('/auth/token/refresh/', {
      refresh: state.auth.refreshToken,
    });
    return response.data;
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; access: string; refresh: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload.access);
      localStorage.setItem('refresh_token', action.payload.refresh);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        localStorage.setItem('access_token', action.payload.access);
        localStorage.setItem('refresh_token', action.payload.refresh);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        localStorage.setItem('access_token', action.payload.access);
        localStorage.setItem('refresh_token', action.payload.refresh);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      })
      
      // Refresh token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.token = action.payload.access;
        localStorage.setItem('access_token', action.payload.access);
      })
      
      // Fetch user profile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        // If profile fetch fails, clear auth
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      });
  },
});

export const { clearError, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
