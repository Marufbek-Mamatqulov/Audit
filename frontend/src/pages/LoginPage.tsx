import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { login, clearError } from '../store/slices/authSlice';
import {
  ChartBarIcon,
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(login(formData)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the slice
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <ChartBarIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Xush kelibsiz
          </h2>
          <p className="text-gray-600 text-lg">
            Audit tizimiga kirishingiz uchun ma'lumotlaringizni kiriting
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-bounceIn">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email manzil
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none relative block w-full pl-10 pr-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 transition-all duration-200 bg-white/50 backdrop-blur"
                    placeholder="admin@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Parol
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="appearance-none relative block w-full pl-10 pr-12 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 transition-all duration-200 bg-white/50 backdrop-blur"
                    placeholder="Parolni kiriting"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Meni eslab qol
                </label>
              </div>

              <div className="text-sm">
                <button type="button" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Parolni unutdingizmi?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-2xl hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Kuting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Kirish
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Demo hisobi:</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-mono">admin@example.com</span>
              </div>
              <div className="flex justify-between">
                <span>Parol:</span>
                <span className="font-mono">admin123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            © 2024 Audit System. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
