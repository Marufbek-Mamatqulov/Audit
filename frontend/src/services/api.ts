import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const response = await this.api.post('/auth/token/refresh/', {
                refresh: refreshToken,
              });
              
              const { access } = response.data;
              localStorage.setItem('access_token', access);
              
              // Retry original request with new token
              original.headers.Authorization = `Bearer ${access}`;
              return this.api(original);
            } catch (refreshError) {
              // Refresh failed, redirect to login
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  get(url: string, config?: AxiosRequestConfig) {
    return this.api.get(url, config);
  }

  post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.post(url, data, config);
  }

  put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.put(url, data, config);
  }

  patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.patch(url, data, config);
  }

  delete(url: string, config?: AxiosRequestConfig) {
    return this.api.delete(url, config);
  }

  // File upload method
  upload(url: string, formData: FormData, config?: AxiosRequestConfig) {
    return this.api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  }
}

const api = new ApiService();

// Auth API methods
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login/', credentials),
  
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    department?: number;
    role?: string;
  }) => api.post('/auth/register/', userData),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout/', { refresh_token: refreshToken }),
  
  refreshToken: (refresh: string) =>
    api.post('/auth/token/refresh/', { refresh }),
  
  getProfile: () => api.get('/auth/profile/'),
  
  updateProfile: (data: any) => api.patch('/auth/profile/', data),
  
  changePassword: (data: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }) => api.post('/auth/change-password/', data),
};

// Users API methods
export const usersApi = {
  getUsers: () => api.get('/auth/users/'),
  
  createUser: (userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    department?: number;
    role?: string;
  }) => api.post('/auth/users/', userData),
  
  getUser: (id: number) => api.get(`/auth/users/${id}/`),
  
  updateUser: (id: number, data: any) => api.patch(`/auth/users/${id}/`, data),
  
  deleteUser: (id: number) => api.delete(`/auth/users/${id}/`),
};

// Departments API methods
export const departmentsApi = {
  getDepartments: () => api.get('/departments/'),
  
  createDepartment: (data: { name: string; parent?: number }) =>
    api.post('/departments/', data),
  
  getDepartment: (id: number) => api.get(`/departments/${id}/`),
  
  updateDepartment: (id: number, data: { name: string; parent?: number }) =>
    api.patch(`/departments/${id}/`, data),
  
  deleteDepartment: (id: number) => api.delete(`/departments/${id}/`),
};

// Files API methods
export const filesApi = {
  getFiles: () => api.get('/files/'),
  
  uploadFile: (formData: FormData) => api.upload('/files/', formData),
  
  getFile: (id: number) => api.get(`/files/${id}/`),
  
  updateFile: (id: number, data: any) => api.patch(`/files/${id}/`, data),
  
  deleteFile: (id: number) => api.delete(`/files/${id}/`),
  
  downloadFile: (id: number) => api.get(`/files/${id}/download/`, {
    responseType: 'blob'
  }),
  
  // File permissions
  getFilePermissions: () => api.get('/files/permissions/'),
  
  createFilePermission: (data: {
    file: number;
    user: number;
    permission_type: 'read' | 'write' | 'admin';
  }) => api.post('/files/permissions/', data),
  
  deleteFilePermission: (id: number) => api.delete(`/files/permissions/${id}/`),
};

// OnlyOffice API methods
export const onlyOfficeApi = {
  createSession: (fileId: number, mode: 'view' | 'edit') =>
    api.post('/files/onlyoffice/create-session/', { file_id: fileId, mode }),
  
  getSession: (sessionId: string) =>
    api.get(`/files/onlyoffice/session/${sessionId}/`),
  
  saveDocument: (sessionId: string, data: any) =>
    api.post(`/files/onlyoffice/save/${sessionId}/`, data),
};

export default api;
