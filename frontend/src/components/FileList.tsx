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
  onViewOneDrive?: (fileId: number, fileName: string) => void;
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
  is_onedrive_embed?: boolean;
  onedrive_embed_url?: string;
  onedrive_direct_link?: string;
}

const FileList: React.FC<FileListProps> = ({ onEditFile, onViewFile, onEditExcel, onViewOneDrive }) => {
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

  const getFileIcon = (fileType: string, isOneDriveEmbed?: boolean) => {
    if (isOneDriveEmbed) {
      return '☁️'; // OneDrive cloud icon
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
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
    <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm lg:text-base font-semibold text-gray-900">📁 Files</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <MagnifyingGlassIcon className="h-3 w-3 lg:h-4 lg:w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-6 lg:pl-8 pr-2 py-1 lg:py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs lg:text-sm bg-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1 lg:p-2 border border-gray-200 rounded-lg transition-all duration-200 ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-3 w-3 lg:h-4 lg:w-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <label className="text-xs font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">All</option>
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="approved">Approved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="overflow-x-auto w-full overflow-y-hidden">
        <table className="w-full divide-y divide-gray-200 table-fixed border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort('name')}
                className="px-1 py-1 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 w-2/5 border-r border-gray-200"
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th className="px-1 py-1 text-left text-xs font-semibold text-gray-700 uppercase w-1/8 border-r border-gray-200">
                Status
              </th>
              <th className="px-1 py-1 text-left text-xs font-semibold text-gray-700 uppercase w-1/8 border-r border-gray-200">
                Dept
              </th>
              <th 
                onClick={() => handleSort('size')}
                className="px-1 py-1 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 w-1/10 border-r border-gray-200"
              >
                <div className="flex items-center space-x-1">
                  <span>Size</span>
                  <SortIcon field="size" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('updated_at')}
                className="px-1 py-1 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 w-1/10 border-r border-gray-200"
              >
                <div className="flex items-center space-x-1">
                  <span>Updated</span>
                  <SortIcon field="updated_at" />
                </div>
              </th>
              <th className="px-1 py-1 text-right text-xs font-semibold text-gray-700 uppercase w-1/6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedFiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      <DocumentIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No files found</h3>
                    <p className="text-xs text-gray-500">
                      {searchTerm || statusFilter ? 'No files match your filters.' : 'Upload your first file.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedFiles.map((file: FileItem, index) => (
                <tr key={file.id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-1 py-1 whitespace-nowrap w-2/5 border-r border-gray-100">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center mr-1">
                        <span className="text-xs">{getFileIcon(file.file_type, file.is_onedrive_embed)}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-0.5">
                          <div className="text-xs font-semibold text-gray-900 truncate">
                            {file.name}
                          </div>
                          {file.is_locked && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🔒
                            </span>
                          )}
                        </div>
                        {file.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {file.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 flex items-center space-x-0.5">
                          <span>v{file.version}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap w-1/8 border-r border-gray-100">
                    {getStatusBadge(file.status)}
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap w-1/8 border-r border-gray-100">
                    <span className="text-xs text-gray-900 truncate">
                      {file.department.name}
                    </span>
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-500 font-medium w-1/10 border-r border-gray-100">
                    {formatFileSize(file.file_size)}
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-500 w-1/10 border-r border-gray-100">
                    {formatDate(file.updated_at)}
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap text-right text-xs font-medium w-1/6">
                    <div className="flex items-center justify-end space-x-0.5">
                      <button
                        onClick={() => onViewFile?.(file.id)}
                        className="p-0.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all duration-200"
                        title="View"
                      >
                        <EyeIcon className="h-3 w-3" />
                      </button>
                      
                      {/* Excel files OneDrive or OnlyOffice */}
                      {file.file_type === 'excel' && file.is_onedrive_embed && (
                        <button
                          onClick={() => onViewOneDrive?.(file.id, file.name)}
                          className="p-0.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all duration-200"
                          title="OneDrive"
                        >
                          <span className="text-xs">☁️</span>
                        </button>
                      )}
                      
                      {file.file_type === 'excel' && !file.is_onedrive_embed && (
                        <button
                          onClick={() => onEditExcel?.(file.id, file.name)}
                          className="p-0.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-all duration-200"
                          title="Excel"
                        >
                          <span className="text-xs">📊</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-0.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all duration-200"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-3 w-3" />
                      </button>
                      
                      {canEditFile(file) && (
                        <button
                          onClick={() => onEditFile?.(file.id)}
                          className="p-0.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded transition-all duration-200 disabled:opacity-50"
                          title="Edit"
                          disabled={file.is_locked && file.locked_by?.id !== user?.id}
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                      )}
                      
                      {canDeleteFile(file) && (
                        <button
                          onClick={() => handleDelete(file.id, file.name)}
                          className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all duration-200"
                          title="Delete"
                        >
                          <TrashIcon className="h-3 w-3" />
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
