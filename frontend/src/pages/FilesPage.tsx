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
}

const FilesPage: React.FC = () => {
  const { user: currentUser } = useAppSelector(state => state.auth);
  const isAdmin = currentUser?.role === 'admin';
  
  const [files, setFiles] = useState<FileData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterFileType, setFilterFileType] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    department: '',
    file_type: 'excel'
  });

  // Xavfsiz arrays
  const safeFiles = Array.isArray(files) ? files : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];

  // Fetch data
  useEffect(() => {
    fetchFiles();
    fetchDepartments();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await filesApi.getFiles();
      const data = response.data;
      setFiles(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
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
      const data = response.data;
      setDepartments(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  // File upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !uploadFormData.name.trim()) {
      alert('Fayl va nom majburiy!');
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', uploadFormData.name);
      formData.append('description', uploadFormData.description);
      formData.append('file_type', uploadFormData.file_type);
      
      if (uploadFormData.department) {
        formData.append('department', uploadFormData.department);
      }

      await filesApi.uploadFile(formData);
      
      setShowUploadModal(false);
      resetUploadForm();
      fetchFiles();
      alert('Fayl muvaffaqiyatli yuklandi!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fayl yuklashda xatolik yuz berdi!');
    } finally {
      setUploadLoading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadFormData({
      name: '',
      description: '',
      department: '',
      file_type: 'excel'
    });
  };

  // File actions
  const handleFileDownload = async (fileId: number, fileName: string) => {
    try {
      const response = await filesApi.downloadFile(fileId);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Faylni yuklab olishda xatolik!');
    }
  };

  const handleFileDelete = async (fileId: number) => {
    if (!window.confirm('Faylni o\'chirishni tasdiqlaysizmi?')) return;
    
    try {
      await filesApi.deleteFile(fileId);
      fetchFiles();
      alert('Fayl muvaffaqiyatli o\'chirildi!');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Faylni o\'chirishda xatolik!');
    }
  };

  const handleFileEdit = (file: FileData) => {
    // Hozircha OnlyOffice o'rniga simple file preview
    if (file.file_type === 'excel') {
      // React sahifasida Excel viewer component ochish
      window.open(`http://localhost:3000/file-editor/${file.id}`, '_blank');
    } else {
      alert('Bu fayl turini tahrirlash hozircha qo\'llab-quvvatlanmaydi');
    }
  };

  const handleFileView = (file: FileData) => {
    if (file.file_type === 'excel') {
      // Excel fayllari uchun viewer component
      window.open(`http://localhost:3000/file-viewer/${file.id}`, '_blank');
    } else {
      // Boshqa fayllar uchun download
      handleFileDownload(file.id, file.name);
    }
  };

  // Filter files
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

  const getFileTypeIcon = (fileType: string) => {
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpenIcon className="h-8 w-8 text-blue-600" />
            Fayllar
          </h1>
          <p className="text-gray-600 mt-1">
            Excel va boshqa hujjatlarni yuklang va tahrirlang
          </p>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Yangi fayl yuklash
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Fayl nomi yoki tavsif..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterFileType}
            onChange={(e) => setFilterFileType(e.target.value)}
          >
            <option value="">Barcha turlar</option>
            <option value="excel">Excel</option>
            <option value="word">Word</option>
            <option value="pdf">PDF</option>
            <option value="other">Boshqa</option>
          </select>

          {/* Stats */}
          <div className="text-sm text-gray-600 flex items-center">
            Jami: {filteredFiles.length} ta fayl
          </div>
        </div>
      </div>

      {/* Files List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Fayllar yuklanmoqda...</p>
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
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fayl
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bo'lim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yuklagan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileTypeIcon(file.file_type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {file.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(file.file_size)} • {file.file_type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {file.department ? file.department.name : 'Umumiy'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(file.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {file.uploaded_by.first_name} {file.uploaded_by.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.uploaded_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => handleFileView(file)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Ko'rish"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        {/* Edit Button - only for Excel files and if user has edit permission */}
                        {file.file_type === 'excel' && file.can_edit && (
                          <button
                            onClick={() => handleFileEdit(file)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Tahrirlash"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}

                        {/* Download Button */}
                        <button
                          onClick={() => handleFileDownload(file.id, file.name)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Yuklab olish"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>

                        {/* Delete Button - only if user has delete permission */}
                        {(file.can_delete || isAdmin) && (
                          <button
                            onClick={() => handleFileDelete(file.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
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
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Yangi fayl yuklash</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="text-gray-400 hover:text-gray-600"
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
                  placeholder="Masalan: Moliyaviy hisobot"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Fayl haqida qisqacha ma'lumot..."
                />
              </div>

              {/* File Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fayl turi
                </label>
                <select
                  value={uploadFormData.file_type}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, file_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="excel">Excel</option>
                  <option value="word">Word</option>
                  <option value="pdf">PDF</option>
                  <option value="other">Boshqa</option>
                </select>
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
                  <option value="">Umumiy (bo'limga bog'lanmagan)</option>
                  {safeDepartments.map(dept => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading || !selectedFile || !uploadFormData.name.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  );
};

export default FilesPage;
