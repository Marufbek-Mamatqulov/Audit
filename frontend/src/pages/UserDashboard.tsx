import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { fetchFiles } from '../store/slices/fileSlice';
import { fetchDepartments } from '../store/slices/departmentSlice';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import OnlyOfficeEditor from '../components/OnlyOfficeEditor';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  FolderIcon,
  UserGroupIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const UserDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { files } = useAppSelector((state: any) => state.file);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showExcelEditor, setShowExcelEditor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{id: number, name: string} | null>(null);
  const [stats, setStats] = useState({
    totalFiles: 0,
    myFiles: 0,
    draftFiles: 0,
    approvedFiles: 0
  });

  useEffect(() => {
    dispatch(fetchFiles());
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    // Ensure files is an array before processing
    const filesArray = Array.isArray(files) ? files : [];
    
    if (filesArray.length > 0) {
      const myFiles = filesArray.filter((file: any) => file.created_by?.id === user?.id);
      const draftFiles = filesArray.filter((file: any) => file.status === 'draft');
      const approvedFiles = filesArray.filter((file: any) => file.status === 'approved');

      setStats({
        totalFiles: filesArray.length,
        myFiles: myFiles.length,
        draftFiles: draftFiles.length,
        approvedFiles: approvedFiles.length
      });
    } else {
      setStats({
        totalFiles: 0,
        myFiles: 0,
        draftFiles: 0,
        approvedFiles: 0
      });
    }
  }, [files, user]);

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    dispatch(fetchFiles()); // Refresh files after upload
  };

  const handleEditFile = (fileId: number) => {
    // Navigate to file editor
    console.log('Edit file:', fileId);
    // TODO: Implement OnlyOffice integration
  };

  const handleViewFile = (fileId: number) => {
    // Navigate to file viewer or preview
    console.log('View file:', fileId);
    // TODO: Implement file preview
  };

  const handleEditExcel = (fileId: number, fileName: string) => {
    setSelectedFile({ id: fileId, name: fileName });
    setShowExcelEditor(true);
  };

  const handleCloseExcelEditor = () => {
    setShowExcelEditor(false);
    setSelectedFile(null);
    // Refresh file list after editing
    dispatch(fetchFiles());
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor, borderColor }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    bgColor?: string;
    borderColor?: string;
  }) => (
    <div className={`${bgColor || 'bg-white'} ${borderColor ? `border ${borderColor}` : ''} rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-4 ${bgColor ? 'bg-white/50' : 'bg-gray-50'} rounded-xl`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  // OnlyOffice Excel Editor Modal
  if (showExcelEditor && selectedFile) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            📊 {selectedFile.name}
          </h2>
          <button
            onClick={handleCloseExcelEditor}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <OnlyOfficeEditor
          fileId={selectedFile.id}
          fileName={selectedFile.name}
          onClose={handleCloseExcelEditor}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center">
              Xush kelibsiz! 👋
            </h1>
            <p className="text-xl text-blue-100 mb-4">
              Bugunku ishlaringiz bilan tanishing va fayllarni boshqaring
            </p>
            <div className="flex items-center space-x-4 text-blue-100">
              <span className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online</span>
              </span>
              <span>Oxirgi kirish: Bugun, 10:02</span>
            </div>
          </div>
          <div className="hidden md:block">
            <ChartBarIcon className="h-24 w-24 text-white/30" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Umumiy fayllar" 
          value={stats.totalFiles} 
          icon={DocumentTextIcon} 
          color="text-blue-600"
          bgColor="bg-gradient-to-br from-blue-50 to-indigo-100"
          borderColor="border-blue-200"
        />
        <StatCard 
          title="Mening fayllarim" 
          value={stats.myFiles} 
          icon={FolderIcon} 
          color="text-green-600"
          bgColor="bg-gradient-to-br from-green-50 to-emerald-100"
          borderColor="border-green-200"
        />
        <StatCard 
          title="Loyiha fayllar" 
          value={stats.draftFiles} 
          icon={DocumentTextIcon} 
          color="text-yellow-600"
          bgColor="bg-gradient-to-br from-yellow-50 to-amber-100"
          borderColor="border-yellow-200"
        />
        <StatCard 
          title="Tasdiqlangan" 
          value={stats.approvedFiles} 
          icon={UserGroupIcon} 
          color="text-purple-600"
          bgColor="bg-gradient-to-br from-purple-50 to-violet-100"
          borderColor="border-purple-200"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">🚀 Tezkor amallar</h2>
        <p className="text-gray-600 mb-6">Asosiy vazifalarni bajaring va fayllarni boshqaring</p>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-2xl hover:scale-105"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Fayl yuklash</span>
          </button>
        </div>
      </div>

      {/* Files Section */}
      <div>
        <FileList
          onEditFile={handleEditFile}
          onViewFile={handleViewFile}
          onEditExcel={handleEditExcel}
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <FileUpload
              onUploadComplete={handleUploadComplete}
              onClose={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
