import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { fetchUsers } from '../store/slices/userSlice';
import { fetchFiles } from '../store/slices/fileSlice';
import { 
  PlusIcon, 
  UserGroupIcon,
  DocumentTextIcon,
  TrashIcon,
  XMarkIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface FilePermission {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  file: {
    id: number;
    name: string;
  };
  permission_type: 'read' | 'write' | 'admin';
  granted_by: {
    id: number;
    username: string;
  };
  granted_at: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface File {
  id: number;
  name: string;
}

const FilePermissionsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector((state: any) => state.user);
  const { files } = useAppSelector((state: any) => state.file);

  const [permissions, setPermissions] = useState<FilePermission[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    file_id: '',
    permission_type: 'read' as 'read' | 'write' | 'admin'
  });

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchFiles());
    fetchPermissions();
  }, [dispatch]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/files/permissions/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/files/permissions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          user_id: parseInt(formData.user_id),
          file_id: parseInt(formData.file_id),
          permission_type: formData.permission_type
        })
      });

      if (response.ok) {
        fetchPermissions();
        setShowCreateModal(false);
        resetForm();
      } else {
        const error = await response.json();
        console.error('Permission creation failed:', error);
        alert('Ruxsat yaratishda xato: ' + (error.detail || error.error || 'Noma\'lum xato'));
      }
    } catch (error) {
      console.error('Error creating permission:', error);
      alert('Ruxsat yaratishda xato');
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    if (window.confirm('Bu ruxsatni bekor qilmoqchimisiz?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/files/permissions/${permissionId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          }
        });

        if (response.ok) {
          fetchPermissions();
        }
      } catch (error) {
        console.error('Error deleting permission:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      file_id: '',
      permission_type: 'read'
    });
  };

  const getPermissionIcon = (permissionType: string) => {
    switch (permissionType) {
      case 'read':
        return <EyeIcon className="h-4 w-4" />;
      case 'write':
        return <PencilSquareIcon className="h-4 w-4" />;
      case 'admin':
        return <ShieldCheckIcon className="h-4 w-4" />;
      default:
        return <EyeIcon className="h-4 w-4" />;
    }
  };

  const getPermissionBadge = (permissionType: string) => {
    const colors = {
      read: 'bg-green-100 text-green-800',
      write: 'bg-blue-100 text-blue-800',
      admin: 'bg-red-100 text-red-800'
    };

    const labels = {
      read: 'Faqat o\'qish',
      write: 'Yozish va o\'qish',
      admin: 'To\'liq kirish'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${colors[permissionType as keyof typeof colors]}`}>
        {getPermissionIcon(permissionType)}
        <span className="ml-1">{labels[permissionType as keyof typeof labels]}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fayl Ruxsatlari</h1>
          <p className="text-gray-600">Foydalanuvchilarga fayllar uchun ruxsatlarni boshqaring</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Ruxsat berish</span>
        </button>
      </div>

      {/* Permissions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Foydalanuvchi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fayl
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruxsat darajasi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kim bergan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Berilgan vaqt
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {permissions.map((permission: FilePermission) => (
              <tr key={permission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserGroupIcon className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {permission.user.first_name} {permission.user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{permission.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="text-sm text-gray-900">{permission.file.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getPermissionBadge(permission.permission_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  @{permission.granted_by.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(permission.granted_at).toLocaleDateString('uz-UZ')} <br />
                  <span className="text-xs">
                    {new Date(permission.granted_at).toLocaleTimeString('uz-UZ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeletePermission(permission.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Ruxsatni bekor qilish"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {permissions.length === 0 && !loading && (
          <div className="text-center py-12">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ruxsatlar yo'q</h3>
            <p className="mt-1 text-sm text-gray-500">Foydalanuvchilarga fayllar uchun ruxsat bering.</p>
          </div>
        )}
      </div>

      {/* Create Permission Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-semibold">Fayl uchun ruxsat berish</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="hover:bg-blue-700 rounded-full p-1"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foydalanuvchi</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Foydalanuvchini tanlang</option>
                  {Array.isArray(users) && users.map((user: User) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} (@{user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fayl</label>
                <select
                  value={formData.file_id}
                  onChange={(e) => setFormData({ ...formData, file_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Faylni tanlang</option>
                  {Array.isArray(files) && files.map((file: File) => (
                    <option key={file.id} value={file.id}>
                      {file.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruxsat darajasi</label>
                <select
                  value={formData.permission_type}
                  onChange={(e) => setFormData({ ...formData, permission_type: e.target.value as 'read' | 'write' | 'admin' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="read">Faqat o'qish</option>
                  <option value="write">Yozish va o'qish</option>
                  <option value="admin">To'liq kirish</option>
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ruxsat darajalari:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>Faqat o'qish:</strong> Fayl ko'rish va yuklab olish</li>
                  <li><strong>Yozish va o'qish:</strong> Fayl tahrirlash va o'zgartirish</li>
                  <li><strong>To'liq kirish:</strong> Fayl o'chirish va ruxsatlarni boshqarish</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleCreatePermission}
                disabled={!formData.user_id || !formData.file_id}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ruxsat berish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePermissionsPage;
