import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { useNavigate } from 'react-router-dom';
import { fetchMyFiles } from '../store/slices/fileSlice';
import { fetchMyDepartment } from '../store/slices/departmentSlice';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const { myFiles } = useAppSelector(state => state.file);

  useEffect(() => {
    if (user) {
      dispatch(fetchMyFiles());
      dispatch(fetchMyDepartment());
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/user-dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Welcome back
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {user?.full_name}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{myFiles.length}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    My Files
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {myFiles.length} files
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.role === 'admin' ? 'A' : user?.role === 'manager' ? 'M' : 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Role
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 capitalize">
                    {user?.role}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">D</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Department
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {user?.department_name || 'Not assigned'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
