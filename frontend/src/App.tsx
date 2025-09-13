import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { fetchUserProfile } from './store/slices/authSlice';

// Components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import ProfilePage from './pages/ProfilePage';
import FilesPage from './pages/FilesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import UsersPage from './pages/UsersPage';
import OnlyOfficeEditor from './components/OnlyOfficeEditor';
import FileViewer from './components/FileViewer';
import FileEditor from './components/FileEditor';
import OneDriveEmbedViewerWrapper from './components/OneDriveEmbedViewerWrapper';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './App.css';

// Wrapper component for OnlyOfficeEditor route
const OnlyOfficeEditorWrapper = () => <OnlyOfficeEditor />;

function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, token } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Check if user is logged in and fetch profile
    if (token && isAuthenticated) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, token, isAuthenticated]);

  return (
    <Router>
      <div className="App overflow-x-hidden w-full max-w-full">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/register" 
            element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} 
          />
          
          {/* Index route */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin-dashboard" element={<AdminDashboard />} />
            <Route path="user-dashboard" element={<UserDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="editor/:fileId" element={<OnlyOfficeEditorWrapper />} />
          </Route>
          
          {/* File viewer and editor routes (standalone) */}
          <Route 
            path="/file-viewer/:id" 
            element={
              <ProtectedRoute>
                <FileViewer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/onedrive-viewer/:id" 
            element={
              <ProtectedRoute>
                <OneDriveEmbedViewerWrapper />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/file-editor/:id" 
            element={
              <ProtectedRoute>
                <FileEditor />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback route */}
          <Route 
            path="*" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
