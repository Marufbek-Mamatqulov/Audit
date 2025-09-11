import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Department {
  id: number;
  name: string;
  description: string | null;
  manager: number | null;
  manager_name: string | null;
  parent: number | null;
  parent_name: string | null;
  full_path: string;
  is_active: boolean;
  user_count: number;
  subdepartment_count: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentTree extends Omit<Department, 'subdepartment_count'> {
  subdepartments: DepartmentTree[];
}

interface DepartmentState {
  departments: Department[];
  currentDepartment: Department | null;
  departmentTree: DepartmentTree[];
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentState = {
  departments: [],
  currentDepartment: null,
  departmentTree: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchDepartments = createAsyncThunk(
  'department/fetchDepartments',
  async () => {
    const response = await api.get('/departments/');
    return response.data;
  }
);

export const fetchDepartmentTree = createAsyncThunk(
  'department/fetchTree',
  async () => {
    const response = await api.get('/departments/tree/');
    return response.data;
  }
);

export const fetchMyDepartment = createAsyncThunk(
  'department/fetchMyDepartment',
  async () => {
    const response = await api.get('/departments/my-department/');
    return response.data;
  }
);

export const createDepartment = createAsyncThunk(
  'department/createDepartment',
  async (departmentData: {
    name: string;
    description?: string;
    manager?: number;
    parent?: number;
  }) => {
    const response = await api.post('/departments/', departmentData);
    return response.data;
  }
);

export const updateDepartment = createAsyncThunk(
  'department/updateDepartment',
  async ({ id, departmentData }: {
    id: number;
    departmentData: Partial<Department>;
  }) => {
    const response = await api.patch(`/departments/${id}/`, departmentData);
    return response.data;
  }
);

export const deleteDepartment = createAsyncThunk(
  'department/deleteDepartment',
  async (id: number) => {
    await api.delete(`/departments/${id}/`);
    return id;
  }
);

export const fetchDepartmentStats = createAsyncThunk(
  'department/fetchStats',
  async (id?: number) => {
    const url = id ? `/departments/${id}/stats/` : '/departments/stats/';
    const response = await api.get(url);
    return response.data;
  }
);

const departmentSlice = createSlice({
  name: 'department',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDepartment: (state, action) => {
      state.currentDepartment = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch departments
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch departments';
      })
      
      // Fetch department tree
      .addCase(fetchDepartmentTree.fulfilled, (state, action) => {
        state.departmentTree = action.payload;
      })
      
      // Fetch my department
      .addCase(fetchMyDepartment.fulfilled, (state, action) => {
        state.currentDepartment = action.payload;
      })
      
      // Create department
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments.push(action.payload);
      })
      
      // Update department
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const index = state.departments.findIndex(dept => dept.id === action.payload.id);
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
      })
      
      // Delete department
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter(dept => dept.id !== action.payload);
      });
  },
});

export const { clearError, setCurrentDepartment } = departmentSlice.actions;
export default departmentSlice.reducer;
