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
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
              {description && (
                <dd className="text-xs text-gray-400 mt-1">{description}</dd>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Admin Dashboard 👨‍💼
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Monitor and manage your document management system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <StatCard
          title="Total Files"
          value={stats.totalFiles}
          icon={DocumentTextIcon}
          color="text-blue-600"
          description="All uploaded files"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={UserGroupIcon}
          color="text-green-600"
          description={`of ${stats.totalUsers} total users`}
        />
        <StatCard
          title="Departments"
          value={stats.totalDepartments}
          icon={BuildingOfficeIcon}
          color="text-purple-600"
          description="Organizational units"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={ClockIcon}
          color="text-yellow-600"
          description="Files awaiting approval"
        />
        <StatCard
          title="Approved"
          value={stats.approvedFiles}
          icon={CheckCircleIcon}
          color="text-green-600"
          description="Ready for use"
        />
        <StatCard
          title="System Health"
          value={99}
          icon={ChartBarIcon}
          color="text-blue-600"
          description="Uptime percentage"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Admin Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload File
            </button>
            <button className="w-full inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              Manage Users
            </button>
            <button className="w-full inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
              Manage Departments
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Server</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">File Storage</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                85% Used
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">OnlyOffice</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Not Configured
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="text-sm text-primary-600 hover:text-primary-500">
              View all activity
            </button>
          </div>
        </div>
      </div>

      {/* Files Management */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">All Files</h2>
          <div className="flex space-x-2">
            <button className="text-sm text-primary-600 hover:text-primary-500">
              Export Report
            </button>
            <button className="text-sm text-primary-600 hover:text-primary-500">
              Bulk Actions
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
