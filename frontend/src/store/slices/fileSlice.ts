import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface FileItem {
  id: number;
  name: string;
  description: string | null;
  file: string;
  file_url: string;
  file_type: 'excel' | 'word' | 'pdf' | 'other';
  status: 'draft' | 'review' | 'approved' | 'archived';
  uploaded_by: number;
  uploaded_by_name: string;
  department: number | null;
  department_name: string | null;
  file_size: number;
  file_size_mb: number;
  version: number;
  is_locked: boolean;
  locked_by: number | null;
  locked_by_name: string | null;
  lock_time: string | null;
  can_edit: boolean;
  can_view: boolean;
  created_at: string;
  updated_at: string;
}

export interface FileVersion {
  id: number;
  version_number: number;
  file_data: string;
  file_size: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
  comment: string | null;
}

export interface OnlyOfficeConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions: {
      comment: boolean;
      download: boolean;
      edit: boolean;
      fillForms: boolean;
      modifyFilter: boolean;
      modifyContentControl: boolean;
      review: boolean;
    };
  };
  documentType: string;
  editorConfig: {
    mode: 'edit' | 'view';
    lang: string;
    callbackUrl: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    customization: {
      about: boolean;
      feedback: boolean;
      goback: {
        url: string;
      };
    };
  };
  type: string;
  width: string;
  height: string;
  token?: string;
}

interface FileState {
  files: FileItem[];
  myFiles: FileItem[];
  sharedFiles: FileItem[];
  currentFile: FileItem | null;
  fileVersions: FileVersion[];
  onlyOfficeConfig: OnlyOfficeConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: FileState = {
  files: [],
  myFiles: [],
  sharedFiles: [],
  currentFile: null,
  fileVersions: [],
  onlyOfficeConfig: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchFiles = createAsyncThunk(
  'file/fetchFiles',
  async (params?: {
    search?: string;
    file_type?: string;
    status?: string;
    department?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.file_type) queryParams.append('file_type', params.file_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.department) queryParams.append('department', params.department.toString());

    const response = await api.get(`/files/?${queryParams.toString()}`);
    return response.data;
  }
);

export const fetchMyFiles = createAsyncThunk(
  'file/fetchMyFiles',
  async () => {
    const response = await api.get('/files/my-files/');
    return response.data;
  }
);

export const fetchSharedFiles = createAsyncThunk(
  'file/fetchSharedFiles',
  async () => {
    const response = await api.get('/files/shared-files/');
    return response.data;
  }
);

export const uploadFile = createAsyncThunk(
  'file/uploadFile',
  async (fileData: FormData) => {
    const response = await api.upload('/files/', fileData);
    return response.data;
  }
);

export const updateFile = createAsyncThunk(
  'file/updateFile',
  async ({ id, fileData }: { id: number; fileData: Partial<FileItem> }) => {
    const response = await api.patch(`/files/${id}/`, fileData);
    return response.data;
  }
);

export const deleteFile = createAsyncThunk(
  'file/deleteFile',
  async (id: number) => {
    await api.delete(`/files/${id}/`);
    return id;
  }
);

export const fetchFileVersions = createAsyncThunk(
  'file/fetchVersions',
  async (fileId: number) => {
    const response = await api.get(`/files/${fileId}/versions/`);
    return response.data;
  }
);

export const uploadFileVersion = createAsyncThunk(
  'file/uploadVersion',
  async ({ fileId, formData }: { fileId: number; formData: FormData }) => {
    const response = await api.post(`/files/${fileId}/upload-version/`, formData);
    return response.data;
  }
);

export const toggleFileLock = createAsyncThunk(
  'file/toggleLock',
  async ({ fileId, action }: { fileId: number; action: 'lock' | 'unlock' }) => {
    const response = await api.post(`/files/${fileId}/lock/`, { action });
    return { fileId, action, data: response.data };
  }
);

export const fetchOnlyOfficeConfig = createAsyncThunk(
  'file/fetchOnlyOfficeConfig',
  async (fileId: number) => {
    const response = await api.get(`/files/${fileId}/onlyoffice-config/`);
    return response.data;
  }
);

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentFile: (state, action) => {
      state.currentFile = action.payload;
    },
    clearOnlyOfficeConfig: (state) => {
      state.onlyOfficeConfig = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch files
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch files';
      })
      
      // Fetch my files
      .addCase(fetchMyFiles.fulfilled, (state, action) => {
        state.myFiles = action.payload;
      })
      
      // Fetch shared files
      .addCase(fetchSharedFiles.fulfilled, (state, action) => {
        state.sharedFiles = action.payload;
      })
      
      // Upload file
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.files.unshift(action.payload);
        state.myFiles.unshift(action.payload);
      })
      
      // Update file
      .addCase(updateFile.fulfilled, (state, action) => {
        const updateArrays = [state.files, state.myFiles, state.sharedFiles];
        updateArrays.forEach(array => {
          const index = array.findIndex(file => file.id === action.payload.id);
          if (index !== -1) {
            array[index] = action.payload;
          }
        });
        if (state.currentFile?.id === action.payload.id) {
          state.currentFile = action.payload;
        }
      })
      
      // Delete file
      .addCase(deleteFile.fulfilled, (state, action) => {
        const fileId = action.payload;
        state.files = state.files.filter(file => file.id !== fileId);
        state.myFiles = state.myFiles.filter(file => file.id !== fileId);
        state.sharedFiles = state.sharedFiles.filter(file => file.id !== fileId);
        if (state.currentFile?.id === fileId) {
          state.currentFile = null;
        }
      })
      
      // Fetch file versions
      .addCase(fetchFileVersions.fulfilled, (state, action) => {
        state.fileVersions = action.payload;
      })
      
      // Toggle file lock
      .addCase(toggleFileLock.fulfilled, (state, action) => {
        const { fileId, action: lockAction } = action.payload;
        const updateArrays = [state.files, state.myFiles, state.sharedFiles];
        
        updateArrays.forEach(array => {
          const file = array.find(f => f.id === fileId);
          if (file) {
            file.is_locked = lockAction === 'lock';
            if (lockAction === 'unlock') {
              file.locked_by = null;
              file.locked_by_name = null;
              file.lock_time = null;
            }
          }
        });
      })
      
      // Fetch OnlyOffice config
      .addCase(fetchOnlyOfficeConfig.fulfilled, (state, action) => {
        state.onlyOfficeConfig = action.payload;
      });
  },
});

export const { clearError, setCurrentFile, clearOnlyOfficeConfig } = fileSlice.actions;
export default fileSlice.reducer;
