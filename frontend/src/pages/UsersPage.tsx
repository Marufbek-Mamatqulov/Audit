import React, { useState, useEffect } from 'react';
import { usersApi, departmentsApi } from '../services/api';
import { useAppSelector } from '../hooks/redux';
import { 
  PlusIcon, 
  UserGroupIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'user';
  department: {
    id: number;
    name: string;
  } | null;
  is_active: boolean;
  date_joined: string;
}

interface Department {
  id: number;
  name: string;
  description: string;
}

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAppSelector(state => state.auth);
  const isAdmin = currentUser?.role === 'admin';
  
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    role: 'user' as 'admin' | 'manager' | 'user',
    department: '',
    is_active: true
  });

  // Fetch data
  useEffect(() => {
    fetchUsersData();
    fetchDepartmentsData();
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers();
      
      // API response ni xavfsiz qabul qilamiz
      let usersData: User[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          usersData = response.data.results;
        }
      }
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentsData = async () => {
    try {
      const response = await departmentsApi.getDepartments();
      
      // API response ni xavfsiz qabul qilamiz
      let deptData: Department[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          deptData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          deptData = response.data.results;
        }
      }
      
      setDepartments(deptData);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      alert('Faqat adminlar yangi foydalanuvchi qo\'sha oladi!');
      return;
    }
    
    // Validate password confirmation
    if (formData.password !== formData.password_confirm) {
      alert('Parollar mos kelmaydi!');
      return;
    }
    
    try {
      setLoading(true);
      await usersApi.createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        department: formData.department ? parseInt(formData.department) : undefined
      });
      
      setShowCreateModal(false);
      resetForm();
      fetchUsersData();
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser || !isAdmin) {
      alert('Faqat adminlar foydalanuvchilarni tahrirlashi mumkin!');
      return;
    }

    try {
      setLoading(true);
      const updateData = { ...formData };
      if (!updateData.password) {
        delete (updateData as any).password;
      }
      
      await usersApi.updateUser(editingUser.id, {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        department: formData.department ? parseInt(formData.department) : null,
        is_active: formData.is_active
      });
      
      setEditingUser(null);
      resetForm();
      fetchUsersData();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!isAdmin) {
      alert('Faqat adminlar foydalanuvchilarni o\'chira oladi!');
      return;
    }
    
    if (!window.confirm('Bu foydalanuvchini o\'chirmoqchimisiz?')) {
      return;
    }

    try {
      setLoading(true);
      await usersApi.deleteUser(id);
      fetchUsersData();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
      role: 'user',
      department: '',
      is_active: true
    });
  };

  const startEditUser = (user: User) => {
    if (!isAdmin) {
      alert('Faqat adminlar foydalanuvchilarni tahrirlashi mumkin!');
      return;
    }
    
    setEditingUser(user);
    setFormData({
      username: user.email, // Use email as username for editing
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '',
      password_confirm: '',
      role: user.role,
      department: user.department ? user.department.id.toString() : '',
      is_active: user.is_active
    });
  };

  // Xavfsiz arrays
  const safeUsers = Array.isArray(users) ? users : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];

  return (
    <div className="p-6">
      {/* Admin Status Alert */}
      <div className={`p-3 rounded-lg mb-4 ${isAdmin ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center space-x-2">
          {isAdmin ? (
            <>
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Admin huquqiga egasiz - barcha amallarni bajara olasiz</span>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">Oddiy foydalanuvchi - faqat ko'rish huquqi</span>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <UserGroupIcon className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Foydalanuvchilar</h1>
            <p className="text-gray-600">Tizim foydalanuvchilarini boshqaring</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Yangi foydalanuvchi</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Foydalanuvchi
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Rol
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Bo'lim
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                {isAdmin && (
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">
                    Amallar
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : safeUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-gray-500">
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
              ) : (
                safeUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 
                         user.role === 'manager' ? 'Menejer' : 'Foydalanuvchi'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {user.department ? user.department.name : 'Belgilanmagan'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2 justify-end">
                          <button
                            onClick={() => startEditUser(user)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Tahrirlash"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="O'chirish"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Yangi foydalanuvchi</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Familiya</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foydalanuvchi nomi</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parolni tasdiqlash</label>
                <input
                  type="password"
                  value={formData.password_confirm}
                  onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'user' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="user">Foydalanuvchi</option>
                  <option value="manager">Menejer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bo'lim</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Bo'lim tanlang</option>
                  {safeDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saqlash...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Foydalanuvchini tahrirlash</h2>
              <button
                onClick={() => {
                  setEditingUser(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Familiya</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parol (bo'sh qoldiring agar o'zgartirmoqchi bo'lmasangiz)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'user' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="user">Foydalanuvchi</option>
                  <option value="manager">Menejer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bo'lim</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Bo'lim tanlang</option>
                  {safeDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Faol foydalanuvchi
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saqlash...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
