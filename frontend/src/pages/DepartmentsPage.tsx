import React, { useState, useEffect } from 'react';
import { departmentsApi } from '../services/api';
import { 
  PlusIcon, 
  BuildingOfficeIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Department {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsApi.getDepartments();
      setDepartments(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await departmentsApi.createDepartment(formData);
      setShowCreateModal(false);
      resetForm();
      fetchDepartments();
    } catch (error) {
      console.error('Error creating department:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;

    try {
      setLoading(true);
      await departmentsApi.updateDepartment(editingDepartment.id, formData);
      setEditingDepartment(null);
      resetForm();
      fetchDepartments();
    } catch (error) {
      console.error('Error updating department:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!window.confirm('Bu bo\'limni o\'chirmoqchimisiz?')) {
      return;
    }

    try {
      setLoading(true);
      await departmentsApi.deleteDepartment(id);
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
  };

  const startEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bo'limlar</h1>
            <p className="text-gray-600">Tashkilot bo'limlarini boshqaring</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Yangi bo'lim</span>
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Bo'limlar yuklanmoqda...</p>
          </div>
        ) : null}

        {/* Department Cards */}
        {Array.isArray(departments) && departments.map((department) => (
          <div key={department.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{department.name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(department.created_at).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEditDepartment(department)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="Tahrirlash"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteDepartment(department.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="O'chirish"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {department.description && (
              <p className="text-gray-600 text-sm mb-3">{department.description}</p>
            )}
          </div>
        ))}

        {/* Empty State */}
        {(!Array.isArray(departments) || departments.length === 0) && !loading && (
          <div className="col-span-full text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Bo'limlar yo'q</h3>
            <p className="mt-1 text-sm text-gray-500">Birinchi bo'limni yarating.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-5 h-5 inline mr-2" />
                Yangi bo'lim
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Yangi bo'lim qo'shish</h2>
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
            <form onSubmit={handleCreateDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bo'lim nomi
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tavsif
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saqlash...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Bo'limni tahrirlash</h2>
              <button
                onClick={() => {
                  setEditingDepartment(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bo'lim nomi
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tavsif
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingDepartment(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Yangilash...' : 'Yangilash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
