import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filesApi } from '../services/api';
import { useAppSelector } from '../hooks/redux';
import { 
  ArrowLeftIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface FileData {
  id: number;
  name: string;
  description: string;
  file_size: number;
  file_type: string;
  status: string;
  uploaded_at: string;
  uploaded_by: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  department: {
    id: number;
    name: string;
  } | null;
  file_url: string;
  can_edit: boolean;
  can_delete: boolean;
}

const FileViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAppSelector(state => state.auth);
  
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchFile(parseInt(id));
    }
  }, [id]);

  const fetchFile = async (fileId: number) => {
    try {
      setLoading(true);
      const response = await filesApi.getFile(fileId);
      setFile(response.data);
    } catch (error: any) {
      console.error('Error fetching file:', error);
      setError('Faylni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;
    
    try {
      const response = await filesApi.downloadFile(file.id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Faylni yuklab olishda xatolik!');
    }
  };

  const handleEdit = () => {
    if (file) {
      navigate(`/file-editor/${file.id}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Fayl yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Xatolik yuz berdi</h2>
          <p className="text-gray-600 mb-4">{error || 'Fayl topilmadi'}</p>
          <button
            onClick={() => navigate('/files')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Fayllar ro'yxatiga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/files')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Orqaga
              </button>
              <div className="flex items-center gap-3">
                <DocumentIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{file.name}</h1>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.file_size)} • {file.file_type.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {file.can_edit && file.file_type === 'excel' && (
                <button
                  onClick={handleEdit}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <PencilIcon className="h-4 w-4" />
                  Tahrirlash
                </button>
              )}
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Yuklab olish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* File Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fayl haqida ma'lumot</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tavsif</h3>
              <p className="mt-1 text-sm text-gray-900">
                {file.description || 'Tavsif yo\'q'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Bo'lim</h3>
              <p className="mt-1 text-sm text-gray-900">
                {file.department ? file.department.name : 'Umumiy'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Yuklagan</h3>
              <p className="mt-1 text-sm text-gray-900">
                {file.uploaded_by.first_name} {file.uploaded_by.last_name}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Yuklangan sana</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(file.uploaded_at).toLocaleDateString('uz-UZ')}
              </p>
            </div>
          </div>
        </div>

        {/* File Preview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fayl ko'rinishi</h2>
          
          {file.file_type === 'excel' ? (
            <div className="border rounded-lg p-8 text-center bg-gray-50">
              <DocumentIcon className="h-20 w-20 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Excel Fayl</h3>
              <p className="text-gray-600 mb-4">
                Excel fayllarni to'liq ko'rish uchun yuklab oling yoki tahrirlash rejimiga o'ting
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Yuklab olish
                </button>
                {file.can_edit && (
                  <button
                    onClick={handleEdit}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Tahrirlash
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center bg-gray-50">
              <DocumentIcon className="h-20 w-20 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {file.file_type.toUpperCase()} Fayl
              </h3>
              <p className="text-gray-600 mb-4">
                Bu fayl turini browser'da ko'rsatib bo'lmaydi. Yuklab oling.
              </p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Yuklab olish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
