import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchFiles, deleteFile } from '../store/slices/fileSlice';
import { 
  DocumentIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface FileListProps {
  onEditFile?: (fileId: number) => void;
  onViewFile?: (fileId: number) => void;
  onEditExcel?: (fileId: number, fileName: string) => void;
}

interface FileItem {
  id: number;
  name: string;
  description: string;
  file_path: string;
  file_size: number;
  file_type: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  department: {
    id: number;
    name: string;
  };
  created_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
  version: number;
  is_locked: boolean;
  locked_by: any;
}

const FileList: React.FC<FileListProps> = ({ onEditFile, onViewFile, onEditExcel }) => {
  const dispatch = useAppDispatch();
  const { files, loading } = useAppSelector((state: any) => state.file);
  const { user } = useAppSelector(state => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'updated_at' | 'size'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchFiles());
  }, [dispatch]);

  const handleDelete = async (fileId: number, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        await dispatch(deleteFile(fileId)).unwrap();
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  const handleDownload = (file: FileItem) => {
    // Create download link
    const link = document.createElement('a');
    link.href = `http://127.0.0.1:8000${file.file_path}`;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFiles = Array.isArray(files) ? files.filter((file: FileItem) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const sortedFiles = [...filteredFiles].sort((a: FileItem, b: FileItem) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'updated_at':
        aValue = new Date(a.updated_at);
        bValue = new Date(b.updated_at);
        break;
      case 'size':
        aValue = a.file_size;
        bValue = b.file_size;
        break;
      default:
        aValue = a.updated_at;
        bValue = b.updated_at;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return '📊';
    } else if (fileType.includes('document') || fileType.includes('word')) {
      return '📄';
    } else if (fileType.includes('pdf')) {
      return '📕';
    } else {
      return '📎';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { 
        color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300', 
        text: '📝 Loyiha',
        icon: '📝'
      },
      review: { 
        color: 'bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-800 border border-yellow-300', 
        text: '👀 Ko\'rib chiqish',
        icon: '👀'
      },
      approved: { 
        color: 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border border-green-300', 
        text: '✅ Tasdiqlangan',
        icon: '✅'
      },
      archived: { 
        color: 'bg-gradient-to-r from-red-100 to-pink-200 text-red-800 border border-red-300', 
        text: '📁 Arxivlangan',
        icon: '📁'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEditFile = (file: FileItem) => {
    return user?.role === 'admin' || 
           user?.role === 'manager' || 
           file.created_by.id === user?.id;
  };

  const canDeleteFile = (file: FileItem) => {
    return user?.role === 'admin' || 
           file.created_by.id === user?.id;
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUpIcon className="h-4 w-4" /> : 
      <ChevronDownIcon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">📁 Fayllar ro'yxati</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Fayllarni qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/50 backdrop-blur transition-all duration-200 hover:shadow-md"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 border border-gray-200 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white/50 backdrop-blur hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white/50 backdrop-blur rounded-xl border border-gray-200/50 animate-slideInLeft">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur"
                >
                  <option value="">Barchasi</option>
                  <option value="draft">Loyiha</option>
                  <option value="review">Ko'rib chiqish</option>
                  <option value="approved">Tasdiqlangan</option>
                  <option value="archived">Arxivlangan</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 backdrop-blur">
            <tr>
              <th 
                onClick={() => handleSort('name')}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100/70 transition-all duration-200 rounded-tl-xl"
              >
                <div className="flex items-center space-x-1">
                  <span>Fayl nomi</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Bo'lim
              </th>
              <th 
                onClick={() => handleSort('size')}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100/70 transition-all duration-200"
              >
                <div className="flex items-center space-x-1">
                  <span>Hajmi</span>
                  <SortIcon field="size" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('updated_at')}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100/70 transition-all duration-200"
              >
                <div className="flex items-center space-x-1">
                  <span>O'zgartirilgan</span>
                  <SortIcon field="updated_at" />
                </div>
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider rounded-tr-xl">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/30 backdrop-blur divide-y divide-gray-200/30">
            {sortedFiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center animate-fadeIn">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                      <DocumentIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Hech qanday fayl topilmadi</h3>
                    <p className="text-sm text-gray-500">
                      {searchTerm || statusFilter ? 'Filterlaringizga mos fayl yo\'q.' : 'Birinchi faylni yuklang.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedFiles.map((file: FileItem, index) => (
                <tr key={file.id} className="hover:bg-white/50 hover:shadow-lg transition-all duration-200 group animate-fadeIn" style={{animationDelay: `${index * 50}ms`}}>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                        <span className="text-xl">{getFileIcon(file.file_type)}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {file.name}
                          </div>
                          {file.is_locked && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200">
                              🔒 Bloklangan
                            </span>
                          )}
                        </div>
                        {file.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                            {file.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1 flex items-center space-x-2">
                          <span>v{file.version}</span>
                          <span>•</span>
                          <span>{file.created_by.first_name} {file.created_by.last_name}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {getStatusBadge(file.status)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center mr-2">
                        <span className="text-xs font-semibold text-gray-600">🏢</span>
                      </div>
                      <span className="text-sm text-gray-900">{file.department.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {formatFileSize(file.file_size)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(file.updated_at)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onViewFile?.(file.id)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Ko'rish"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {/* Excel fayllar uchun OnlyOffice editor tugma */}
                      {file.file_type === 'excel' && (
                        <button
                          onClick={() => onEditExcel?.(file.id, file.name)}
                          className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Excel da tahrirlash"
                        >
                          <span className="text-sm font-bold">📊</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Yuklab olish"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      
                      {canEditFile(file) && (
                        <button
                          onClick={() => onEditFile?.(file.id)}
                          className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          title="Tahrirlash"
                          disabled={file.is_locked && file.locked_by?.id !== user?.id}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {canDeleteFile(file) && (
                        <button
                          onClick={() => handleDelete(file.id, file.name)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="O'chirish"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileList;
