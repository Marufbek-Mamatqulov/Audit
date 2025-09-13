import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { fetchFiles } from '../store/slices/fileSlice';
import { fetchUsers } from '../store/slices/userSlice';
import { fetchDepartments } from '../store/slices/departmentSlice';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import { 
  PlusIcon, 
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { files } = useAppSelector((state: any) => state.file);
  const { users } = useAppSelector((state: any) => state.user);
  const { departments } = useAppSelector((state: any) => state.department);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalUsers: 0,
    totalDepartments: 0,
    pendingReview: 0,
    approvedFiles: 0,
    activeUsers: 0
  });

  useEffect(() => {
    dispatch(fetchFiles());
    dispatch(fetchUsers());
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    // Ensure arrays are properly initialized
    const filesArray = Array.isArray(files) ? files : [];
    const usersArray = Array.isArray(users) ? users : [];
    const departmentsArray = Array.isArray(departments) ? departments : [];
    
    const pendingFiles = filesArray.filter((file: any) => file.status === 'review').length;
    const approvedFiles = filesArray.filter((file: any) => file.status === 'approved').length;
    const activeUsers = usersArray.filter((user: any) => user.is_active).length;

    setStats({
      totalFiles: filesArray.length,
      totalUsers: usersArray.length,
      totalDepartments: departmentsArray.length,
      pendingReview: pendingFiles,
      approvedFiles: approvedFiles,
      activeUsers: activeUsers
    });
  }, [files, users, departments]);

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    dispatch(fetchFiles());
  };

  const handleEditFile = (fileId: number) => {
    console.log('Edit file:', fileId);
    // TODO: Implement OnlyOffice integration
  };

  const handleViewFile = (fileId: number) => {
    console.log('View file:', fileId);
    // TODO: Implement file preview
  };

  const StatCard = ({ title, value, icon: Icon, color, description }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    description?: string;
  }) => (
    <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-200">
      <div className="p-2 lg:p-3">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="p-1 lg:p-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <Icon className={`h-3 w-3 lg:h-4 lg:w-4 ${color}`} aria-hidden="true" />
            </div>
          </div>
          <div className="ml-2 w-0 flex-1 min-w-0">
            <dl>
              <dt className="text-xs font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-sm lg:text-base font-bold text-gray-900">{value}</dd>
              {description && (
                <dd className="text-xs text-gray-400 truncate">{description}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const recentActivity = [
    { id: 1, type: 'file_upload', user: 'John Doe', action: 'uploaded Budget_2024.xlsx', time: '5 minutes ago' },
    { id: 2, type: 'file_approval', user: 'Jane Smith', action: 'approved Financial_Report.docx', time: '1 hour ago' },
    { id: 3, type: 'user_login', user: 'Mike Johnson', action: 'logged in to the system', time: '2 hours ago' },
    { id: 4, type: 'department_created', user: 'Admin', action: 'created Marketing department', time: '1 day ago' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'file_upload': return <DocumentTextIcon className="h-4 w-4 text-blue-500" />;
      case 'file_approval': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'user_login': return <UserGroupIcon className="h-4 w-4 text-purple-500" />;
      case 'department_created': return <BuildingOfficeIcon className="h-4 w-4 text-yellow-500" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="w-full mx-auto px-2 lg:px-3 py-2 lg:py-3">
      {/* Welcome Header */}
      <div className="mb-3 lg:mb-4">
        <h1 className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
          RTRMM - Moliya Dashboard
        </h1>
        <p className="mt-1 text-xs lg:text-sm text-gray-600">
          Raqamli Ta'limni Rivojlantirish Markazi moliya bo'limi boshqaruv paneli
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3 mb-3 lg:mb-4">
        <StatCard
          title="Files"
          value={stats.totalFiles}
          icon={DocumentTextIcon}
          color="text-blue-600"
          description="Total"
        />
        <StatCard
          title="Users"
          value={stats.activeUsers}
          icon={UserGroupIcon}
          color="text-green-600"
          description="Active"
        />
        <StatCard
          title="Depts"
          value={stats.totalDepartments}
          icon={BuildingOfficeIcon}
          color="text-purple-600"
          description="Units"
        />
        <StatCard
          title="Pending"
          value={stats.pendingReview}
          icon={ClockIcon}
          color="text-yellow-600"
          description="Review"
        />
        <StatCard
          title="Approved"
          value={stats.approvedFiles}
          icon={CheckCircleIcon}
          color="text-green-600"
          description="Ready"
        />
        <StatCard
          title="Health"
          value={99}
          icon={ChartBarIcon}
          color="text-blue-600"
          description="Uptime"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 mb-3 lg:mb-4">
        {/* Admin Actions */}
        <div className="bg-white shadow-lg rounded-lg p-3 lg:p-4 border border-gray-200">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <PlusIcon className="h-4 w-4 text-blue-600" />
            Quick Actions
          </h3>
          <div className="space-y-2 lg:space-y-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full inline-flex items-center justify-center px-3 lg:px-4 py-2 border border-transparent text-xs lg:text-sm font-semibold rounded-lg shadow-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:shadow-xl"
            >
              <PlusIcon className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              Upload File
            </button>
            <button className="w-full inline-flex items-center justify-center px-3 lg:px-4 py-2 border border-gray-300 text-xs lg:text-sm font-semibold rounded-lg shadow-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-xl">
              <UserGroupIcon className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              Users
            </button>
            <button className="w-full inline-flex items-center justify-center px-3 lg:px-4 py-2 border border-gray-300 text-xs lg:text-sm font-semibold rounded-lg shadow-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-xl">
              <BuildingOfficeIcon className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              Departments
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white shadow-lg rounded-lg p-3 lg:p-4 border border-gray-200">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4 text-green-600" />
            System Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm text-gray-600">API</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm text-gray-600">DB</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm text-gray-600">Storage</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                85%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm text-gray-600">Office</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Config
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-lg rounded-lg p-3 lg:p-4 border border-gray-200">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-blue-600" />
            Activity
          </h3>
          <div className="space-y-2">
            {recentActivity.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm text-gray-900 truncate">
                    <span className="font-medium">{activity.user}</span> {activity.action.split(' ').slice(0, 3).join(' ')}...
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <button className="text-xs text-primary-600 hover:text-primary-500">
              View all
            </button>
          </div>
        </div>
      </div>

      {/* Files Management */}
      <div className="mb-3 lg:mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 lg:mb-3 space-y-2 sm:space-y-0">
          <h2 className="text-sm lg:text-base font-medium text-gray-900">All Files</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button className="text-xs lg:text-sm text-primary-600 hover:text-primary-500 px-2 py-1 border border-primary-200 rounded hover:bg-primary-50">
              Export
            </button>
            <button className="text-xs lg:text-sm text-primary-600 hover:text-primary-500 px-2 py-1 border border-primary-200 rounded hover:bg-primary-50">
              Bulk
            </button>
          </div>
        </div>
        
        <FileList 
          onEditFile={handleEditFile}
          onViewFile={handleViewFile}
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <FileUpload
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
