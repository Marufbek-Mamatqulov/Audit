import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OneDriveEmbedViewer from './OneDriveEmbedViewer';

interface FileInfo {
  id: number;
  name: string;
  is_onedrive_embed: boolean;
}

const OneDriveEmbedViewerWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileInfo = async () => {
      if (!id) return;
      
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`/api/files/${id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Fayl ma\'lumotlarini olishda xato');
        }

        const data = await response.json();
        
        if (!data.is_onedrive_embed) {
          throw new Error('Bu fayl OneDrive embed emas');
        }

        setFileInfo(data);
      } catch (error) {
        console.error('Fayl ma\'lumotlarini olishda xato:', error);
        setError(error instanceof Error ? error.message : 'Noma\'lum xato');
      } finally {
        setLoading(false);
      }
    };

    fetchFileInfo();
  }, [id]);

  const handleClose = () => {
    navigate('/dashboard/files');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !fileInfo) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Xato!</h2>
          <p className="text-gray-600 mb-4">{error || 'Fayl topilmadi'}</p>
          <button
            onClick={handleClose}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Fayllar ro'yxatiga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <OneDriveEmbedViewer
      fileId={fileInfo.id}
      fileName={fileInfo.name}
      onClose={handleClose}
    />
  );
};

export default OneDriveEmbedViewerWrapper;