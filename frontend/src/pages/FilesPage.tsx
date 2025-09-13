import React, { useState, useEffect } from 'react';
import { filesApi, departmentsApi } from '../services/api';
import { useAppSelector } from '../hooks/redux';
import { 
  PlusIcon, 
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FolderOpenIcon,
  XMarkIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface Department {
  id: number;
  name: string;
  description: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
}

interface FileData {
  id: number;
  name: string;
  description: string;
  file_size: number;
  file_type: string;
  status: string;
  uploaded_at: string;
  updated_at: string;
  uploaded_by: User;
  department: Department | null;
  file_url: string;
  can_edit: boolean;
  can_delete: boolean;
  is_onedrive_embed?: boolean;
  onedrive_embed_url?: string;
  onedrive_direct_link?: string;
}

const FilesPage: React.FC = () => {
  const { user: currentUser } = useAppSelector(state => state.auth);
  const isAdmin = currentUser?.role === 'admin';
  
  const [files, setFiles] = useState<FileData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterFileType, setFilterFileType] = useState('');
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showOneDriveModal, setShowOneDriveModal] = useState(false);
  
  // Upload form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    department: ''
  });
  
  // OneDrive form states
  const [oneDriveFormData, setOneDriveFormData] = useState({
    name: '',
    description: '',
    embed_url: '',
    direct_link: '',
    department: ''
  });

  // Fetch data
  useEffect(() => {
    fetchFiles();
    fetchDepartments();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await filesApi.getFiles();
      
      let filesData: FileData[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          filesData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          filesData = response.data.results;
        }
      }
      
      setFiles(filesData);
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsApi.getDepartments();
      
      let deptData: Department[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          deptData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          deptData = response.data.results;
        }
      }
      
      setDepartments(deptData);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  // File operations
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Iltimos fayl tanlang');
      return;
    }

    try {
      setUploadLoading(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', uploadFormData.name || selectedFile.name);
      formData.append('description', uploadFormData.description);
      if (uploadFormData.department) {
        formData.append('department', uploadFormData.department);
      }

      await filesApi.uploadFile(formData);
      
      setShowUploadModal(false);
      resetUploadForm();
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fayl yuklashda xatolik yuz berdi');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleOneDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploadLoading(true);
      
      await filesApi.createOneDriveEmbed({
        name: oneDriveFormData.name,
        description: oneDriveFormData.description,
        onedrive_embed_url: oneDriveFormData.embed_url,
        onedrive_direct_link: oneDriveFormData.direct_link,
        department: oneDriveFormData.department ? parseInt(oneDriveFormData.department) : undefined
      });
      
      setShowOneDriveModal(false);
      resetOneDriveForm();
      fetchFiles();
    } catch (error) {
      console.error('Error creating OneDrive embed:', error);
      alert('OneDrive fayl yaratishda xatolik yuz berdi');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileDelete = async (fileId: number) => {
    if (!window.confirm('Bu faylni o\'chirmoqchimisiz?')) {
      return;
    }

    try {
      await filesApi.deleteFile(fileId);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Fayl o\'chirishda xatolik yuz berdi');
    }
  };

  const handleFileDownload = async (fileId: number, fileName: string) => {
    try {
      const response = await filesApi.downloadFile(fileId);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Fayl yuklab olishda xatolik yuz berdi');
    }
  };

  const handleFileView = (file: FileData) => {
    if (file.is_onedrive_embed && file.onedrive_embed_url) {
      // OneDrive embed fayllar uchun
      window.open(`http://localhost:3000/onedrive-viewer/${file.id}`, '_blank');
    } else if (file.file_type === 'excel') {
      // Oddiy Excel fayllari uchun OnlyOffice viewer
      window.open(`http://localhost:3000/file-viewer/${file.id}`, '_blank');
    } else {
      // Boshqa fayllar uchun download
      handleFileDownload(file.id, file.name);
    }
  };

  const handleFileEdit = (file: FileData) => {
    if (file.file_type === 'excel' && !file.is_onedrive_embed) {
      window.open(`http://localhost:3000/file-editor/${file.id}`, '_blank');
    }
  };

  // Helper functions
  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadFormData({
      name: '',
      description: '',
      department: ''
    });
  };

  const resetOneDriveForm = () => {
    setOneDriveFormData({
      name: '',
      description: '',
      embed_url: '',
      direct_link: '',
      department: ''
    });
  };

  // Filter files
  const safeFiles = Array.isArray(files) ? files : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];
  
  const filteredFiles = safeFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !filterDepartment || 
                             (file.department && file.department.id.toString() === filterDepartment);
    
    const matchesFileType = !filterFileType || file.file_type === filterFileType;
    
    return matchesSearch && matchesDepartment && matchesFileType;
  });

  // Utility functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string, isOneDriveEmbed: boolean = false) => {
    if (isOneDriveEmbed) {
      return (
        <div className="relative">
          <DocumentDuplicateIcon className="h-5 w-5 text-blue-600" />
          <span className="absolute -top-1 -right-1 text-xs">☁️</span>
        </div>
      );
    }
    
    switch (fileType) {
      case 'excel':
        return <DocumentDuplicateIcon className="h-5 w-5 text-green-600" />;
      case 'word':
        return <DocumentIcon className="h-5 w-5 text-blue-600" />;
      case 'pdf':
        return <DocumentIcon className="h-5 w-5 text-red-600" />;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'draft': 'bg-yellow-100 text-yellow-800',
      'review': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'archived': 'bg-gray-100 text-gray-800'
    };

    const statusNames: Record<string, string> = {
      'draft': 'Loyiha',
      'review': 'Ko\'rib chiqilmoqda',
      'approved': 'Tasdiqlangan',
      'archived': 'Arxivlangan'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || badges['draft']}`}>
        {statusNames[status] || status}
      </span>
    );
  };

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FolderOpenIcon className="h-7 w-7 text-blue-600" />
            Fayllar
          </h1>
          <p className="text-gray-600 mt-2 text-base">
            Excel va boshqa hujjatlarni yuklang va tahrirlang
          </p>
        </div>
        
        {/* Admin buttons */}
        {isAdmin ? (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto lg:w-auto">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-xs lg:text-sm font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <PlusIcon className="h-4 w-4" />
              Fayl yuklash
            </button>
            <button
              onClick={() => setShowOneDriveModal(true)}
              className="bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-xs lg:text-sm font-medium shadow-lg hover:shadow-xl transition-all"
            >
              ☁️ OneDrive
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-xs lg:text-sm font-medium shadow-lg hover:shadow-xl transition-all w-full sm:w-auto lg:w-auto"
          >
            <PlusIcon className="h-4 w-4" />
            Yangi fayl
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2 xl:col-span-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Fayl nomi yoki tavsif..."
              className="w-full pl-8 pr-2 py-2 text-xs lg:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <select
            className="px-2 py-2 text-xs lg:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="">Barcha bo'limlar</option>
            {safeDepartments.map(dept => (
              <option key={dept.id} value={dept.id.toString()}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* File Type Filter */}
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterFileType}
            onChange={(e) => setFilterFileType(e.target.value)}
          >
            <option value="">Barcha turlar</option>
            <option value="excel">Excel</option>
            <option value="word">Word</option>
            <option value="pdf">PDF</option>
          </select>

          {/* Total Count */}
          <div className="flex items-center justify-center sm:justify-start bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-600">
              Jami: <span className="font-medium">{filteredFiles.length}</span> ta fayl
            </span>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <FolderOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hech qanday fayl topilmadi</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterDepartment || filterFileType 
              ? "Qidiruv shartlariga mos fayl mavjud emas" 
              : "Hali hech qanday fayl yuklanmagan"}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Birinchi faylni yuklash
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden xl:block bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="w-full">
              <table className="w-full divide-y divide-gray-200 table-fixed border-collapse">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-1 py-1 text-left text-xs font-semibold text-gray-600 uppercase w-1/4 border-r border-gray-200">
                      Fayl
                    </th>
                    <th className="px-1 py-1 text-left text-xs font-semibold text-gray-600 uppercase w-1/8 border-r border-gray-200">
                      Bo'lim
                    </th>
                    <th className="px-1 py-1 text-left text-xs font-semibold text-gray-600 uppercase w-1/12 border-r border-gray-200">
                      Status
                    </th>
                    <th className="px-1 py-1 text-left text-xs font-semibold text-gray-600 uppercase w-1/8 border-r border-gray-200">
                      User
                    </th>
                    <th className="px-1 py-1 text-left text-xs font-semibold text-gray-600 uppercase w-1/12 border-r border-gray-200">
                      Date
                    </th>
                    <th className="px-1 py-1 text-center text-xs font-semibold text-gray-600 uppercase w-1/3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-1 py-1 w-1/4 border-r border-gray-100">
                        <div className="flex items-center space-x-1">
                          <div className="flex-shrink-0">
                            {getFileTypeIcon(file.file_type, file.is_onedrive_embed)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-900 truncate">
                              {file.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(file.file_size)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap w-1/8 border-r border-gray-100">
                        <span className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded text-xs font-medium truncate block">
                          {file.department?.name ? file.department.name.substring(0, 6) : 'Umumiy'}
                        </span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap w-1/12 border-r border-gray-100">
                        <span className="px-1 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800 block text-center">
                          OK
                        </span>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap w-1/8 border-r border-gray-100">
                        <div className="flex items-center space-x-0.5">
                          <div className="h-4 w-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {(file.uploaded_by?.first_name?.[0] || file.uploaded_by?.email?.[0] || 'U').toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-900 truncate">
                            {file.uploaded_by?.first_name ? file.uploaded_by.first_name.substring(0, 4) : 
                             file.uploaded_by?.email ? file.uploaded_by.email.substring(0, 4) : 'User'}
                          </div>
                        </div>
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-500 w-1/12 border-r border-gray-100">
                        {new Date(file.uploaded_at).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="px-1 py-1 whitespace-nowrap w-1/3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleFileView(file)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-all duration-200"
                            title="Ko'rish"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>

                          {/* Edit Button - only for Excel files and if user has edit permission */}
                          {file.file_type === 'excel' && file.can_edit && !file.is_onedrive_embed && (
                            <button
                              onClick={() => handleFileEdit(file)}
                              className="text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded transition-all duration-200"
                              title="Tahrirlash"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleFileDownload(file.id, file.name)}
                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-all duration-200"
                            title="Yuklab olish"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>

                          {/* Delete Button - only if user has delete permission */}
                          {(file.can_delete || isAdmin) && (
                            <button
                              onClick={() => handleFileDelete(file.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-all duration-200"
                              title="O'chirish"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile and Tablet Cards */}
          <div className="xl:hidden space-y-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileTypeIcon(file.file_type, file.is_onedrive_embed)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatFileSize(file.file_size)} • {file.file_type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => handleFileView(file)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded transition-colors"
                      title="Ko'rish"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {/* Edit Button - only for Excel files and if user has edit permission */}
                    {file.file_type === 'excel' && file.can_edit && !file.is_onedrive_embed && (
                      <button
                        onClick={() => handleFileEdit(file)}
                        className="text-green-600 hover:text-green-900 p-2 rounded transition-colors"
                        title="Tahrirlash"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleFileDownload(file.id, file.name)}
                      className="text-green-600 hover:text-green-900 p-2 rounded transition-colors"
                      title="Yuklab olish"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    
                    {(file.can_delete || isAdmin) && (
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded transition-colors"
                        title="O'chirish"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Bo'lim:</span>
                    <span className="ml-1">{file.department?.name || 'Umumiy'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Holat:</span>
                    <span className="ml-1">{getStatusBadge(file.status)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Yuklagan:</span>
                    <span className="ml-1">
                      {file.uploaded_by?.first_name || ''} {file.uploaded_by?.last_name || ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sana:</span>
                    <span className="ml-1">{new Date(file.uploaded_at).toLocaleDateString('uz-UZ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Yangi fayl yuklash</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fayl tanlash *
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.docx,.doc,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Excel (.xlsx, .xls), Word (.docx, .doc), PDF fayllarini qo'llab-quvvatlaydi
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fayl nomi *
                </label>
                <input
                  type="text"
                  value={uploadFormData.name}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Fayl nomini kiriting"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tavsif
                </label>
                <textarea
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Fayl haqida qisqacha ma'lumot"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bo'lim
                </label>
                <select
                  value={uploadFormData.department}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Bo'limni tanlang</option>
                  {safeDepartments.map(dept => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Yuklanmoqda...
                    </>
                  ) : (
                    'Yuklash'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OneDrive Modal */}
      {showOneDriveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">OneDrive Excel Embed</h3>
              <button
                onClick={() => {
                  setShowOneDriveModal(false);
                  resetOneDriveForm();
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleOneDriveSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fayl nomi *
                </label>
                <input
                  type="text"
                  value={oneDriveFormData.name}
                  onChange={(e) => setOneDriveFormData({ ...oneDriveFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Excel fayl nomini kiriting"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tavsif
                </label>
                <textarea
                  value={oneDriveFormData.description}
                  onChange={(e) => setOneDriveFormData({ ...oneDriveFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Fayl haqida qisqacha ma'lumot"
                />
              </div>

              {/* Embed URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OneDrive Embed URL *
                </label>
                <input
                  type="url"
                  value={oneDriveFormData.embed_url}
                  onChange={(e) => setOneDriveFormData({ ...oneDriveFormData, embed_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://onedrive.live.com/embed?..."
                  required
                />
              </div>

              {/* Direct Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OneDrive Direct Link
                </label>
                <input
                  type="url"
                  value={oneDriveFormData.direct_link}
                  onChange={(e) => setOneDriveFormData({ ...oneDriveFormData, direct_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://1drv.ms/x/..."
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bo'lim
                </label>
                <select
                  value={oneDriveFormData.department}
                  onChange={(e) => setOneDriveFormData({ ...oneDriveFormData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Bo'limni tanlang</option>
                  {safeDepartments.map(dept => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOneDriveModal(false);
                    resetOneDriveForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Yuklanmoqda...
                    </>
                  ) : (
                    'Yaratish'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesPage;