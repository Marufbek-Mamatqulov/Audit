import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logout } from '../store/slices/authSlice';
import {
  HomeIcon,
  DocumentIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const Layout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector(state => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const navigation = [
    { 
      name: 'Bosh sahifa', 
      href: user?.role === 'admin' ? '/admin-dashboard' : '/user-dashboard', 
      icon: HomeIcon 
    },
    { name: 'Fayllar', href: '/files', icon: DocumentIcon },
    { name: 'Profil', href: '/profile', icon: UserIcon },
  ];

  // Admin/Manager uchun qo'shimcha sahifalar
  if (user?.role === 'admin') {
    navigation.splice(2, 0, 
      { name: 'Foydalanuvchilar', href: '/users', icon: UserGroupIcon },
      { name: 'Bo\'limlar', href: '/departments', icon: BuildingOfficeIcon }
    );
  } else if (user?.role === 'manager') {
    navigation.splice(2, 0, 
      { name: 'Bo\'limlar', href: '/departments', icon: BuildingOfficeIcon }
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 lg:w-64 flex-shrink-0 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 transform transition-all duration-300 ease-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo qismi */}
        <div className="flex items-center justify-center lg:justify-between h-16 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold text-white">Audit</h1>
              <p className="text-sm text-blue-100">Docs</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-4 overflow-y-auto">
          <div className="space-y-2">
            {navigation.map((item, index) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md'
                  }`
                }
                title={item.name}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 transition-all ${
                  location.pathname.includes(item.href.split('/')[1]) ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'
                }`} />
                <span>{item.name}</span>
                {location.pathname.includes(item.href.split('/')[1]) && (
                  <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Foydalanuvchi ma'lumotlari */}
        <div className="p-4 border-t border-gray-200/50 bg-gradient-to-t from-gray-50/50 to-transparent">
          <div className="bg-white rounded-lg p-3 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.first_name || user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize flex items-center">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mr-1"></span>
                  {user?.role === 'admin' ? 'Admin' : 
                   user?.role === 'manager' ? 'Manager' : 'User'}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <NavLink
                to="/profile"
                className="flex-1 flex items-center justify-center rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
                title="Profil"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                <span>Profil</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-pink-500 px-3 py-2 text-sm font-medium text-white hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-red-500/25"
                title="Chiqish"
              >
                <ArrowRightOnRectangleIcon className="h-3 w-3 lg:mr-1" />
                Chiqish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Document Management
                </h2>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Qidiruv..." 
                  className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-32 min-w-0"
                />
              </div>
              
              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <BellIcon className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">3</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="w-full max-w-full animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
