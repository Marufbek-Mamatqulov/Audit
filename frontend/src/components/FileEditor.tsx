import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filesApi } from '../services/api';
import { useAppSelector } from '../hooks/redux';
import { 
  ArrowLeftIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
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

const FileEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAppSelector(state => state.auth);
  
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
      
      // Tahrirlash huquqini tekshirish
      if (!response.data.can_edit) {
        setError('Sizda bu faylni tahrirlash huquqi yo\'q');
      }
    } catch (error: any) {
      console.error('Error fetching file:', error);
      setError('Faylni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!file) return;
    
    try {
      setSaving(true);
      // Bu yerda file content'ni saqlash logic'i bo'ladi
      // Hozircha demo uchun
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date());
      alert('Fayl muvaffaqiyatli saqlandi!');
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Faylni saqlashda xatolik!');
    } finally {
      setSaving(false);
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

  const handleView = () => {
    if (file) {
      navigate(`/file-viewer/${file.id}`);
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
                <DocumentIcon className="h-8 w-8 text-green-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">✏️ {file.name}</h1>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.file_size)} • {file.file_type.toUpperCase()} • Tahrirlash rejimi
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastSaved && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  Saqlandi: {lastSaved.toLocaleTimeString('uz-UZ')}
                </div>
              )}
              
              <button
                onClick={handleView}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <EyeIcon className="h-4 w-4" />
                Ko'rish
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saqlanmoqda...
                  </>
                ) : (
                  'Saqlash'
                )}
              </button>
              
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

      {/* Editor Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border">
          {file.file_type === 'excel' ? (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Excel Tahrirlash</h2>
              
              {/* Demo Excel Editor Interface */}
              <div className="border rounded-lg overflow-hidden">
                {/* Toolbar */}
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center gap-2 text-sm">
                  <button className="px-3 py-1 bg-white border rounded hover:bg-gray-50">📁 Fayl</button>
                  <button className="px-3 py-1 bg-white border rounded hover:bg-gray-50">📝 Tahrirlash</button>
                  <button className="px-3 py-1 bg-white border rounded hover:bg-gray-50">📊 Kiritish</button>
                  <div className="border-l mx-2 h-6"></div>
                  <button className="px-3 py-1 bg-white border rounded hover:bg-gray-50">📋 Nusxalash</button>
                  <button className="px-3 py-1 bg-white border rounded hover:bg-gray-50">📄 Joylashtirish</button>
                  <div className="border-l mx-2 h-6"></div>
                  <button className="px-3 py-1 bg-white border rounded hover:bg-gray-50">🔤 Arial</button>
                  <button className="px-3 py-1 bg-white border rounded hover:bg-gray-50">12</button>
                </div>

                {/* Spreadsheet Area */}
                <div className="bg-white p-4">
                  <div className="text-center py-16 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                    <DocumentIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Excel Tahrirlash Demo</h3>
                    <p className="text-gray-600 mb-4">
                      To'liq Excel tahrirlash uchun OnlyOffice Document Server o'rnatish kerak
                    </p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p>• Hozircha bu demo interfeys</p>
                      <p>• Excel faylni yuklab olib, kompyuterda tahrirlang</p>
                      <p>• Yoki OnlyOffice/Google Sheets integratsiyasini qo'shing</p>
                    </div>
                    
                    <div className="mt-6 flex justify-center gap-3">
                      <button
                        onClick={handleDownload}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Faylni yuklab olish
                      </button>
                      <button
                        onClick={handleSave}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Demo saqlash
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Fayl nomi</h3>
                  <p className="text-sm text-gray-900">{file.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">O'lcham</h3>
                  <p className="text-sm text-gray-900">{formatFileSize(file.file_size)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Oxirgi o'zgartirish</h3>
                  <p className="text-sm text-gray-900">
                    {lastSaved ? lastSaved.toLocaleString('uz-UZ') : 'Hali saqlanmagan'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tahrirlash qo'llab-quvvatlanmaydi</h3>
              <p className="text-gray-600">
                Faqat Excel fayllarini tahrirlash mumkin
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileEditor;
