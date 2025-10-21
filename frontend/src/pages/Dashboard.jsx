import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, UserPlus } from 'lucide-react';
import authService from '../services/authService';
import { useTheme } from '../utils/ThemeContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    // Load admin data
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      setAdmin(JSON.parse(adminData));
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-cyan-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg text-white' 
        : 'bg-gradient-to-br from-gray-100 via-white to-gray-100 text-gray-900'
    }`}>
      {/* Header */}
      <div className={`backdrop-blur-lg border-b ${
        theme === 'dark' 
          ? 'bg-gray-800/50 border-white/10' 
          : 'bg-white/50 border-gray-200'
      }`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            <span className="text-cyan-primary">Gest</span>
            <span className="text-cyan-secondary">Pipe</span>
            <span className="text-white ml-2">Dashboard</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
              {admin.fullName} 
              <span className="ml-2 px-2 py-1 bg-cyan-primary/20 text-cyan-primary rounded text-xs">
                {admin.role}
              </span>
            </span>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700/50 text-cyan-primary hover:bg-gray-700'
                  : 'bg-gray-200 text-blue-600 hover:bg-gray-300'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className={`bg-gradient-to-br p-6 rounded-xl backdrop-blur-lg ${
            theme === 'dark'
              ? 'from-cyan-primary/20 to-cyan-secondary/20 border border-white/10'
              : 'from-cyan-100 to-blue-100 border border-gray-200 shadow-lg'
          }`}>
            <h2 className="text-xl font-semibold text-cyan-primary mb-2">Welcome Back!</h2>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{admin.fullName}</p>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{admin.email}</p>
          </div>

          {/* Stats Card */}
          <div className={`backdrop-blur-lg p-6 rounded-xl ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white border border-gray-200 shadow-lg'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quick Stats</h3>
            <div className={`space-y-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>Role: <span className="text-cyan-primary font-semibold">{admin.role}</span></p>
              <p>Status: <span className="text-green-500 font-semibold">{admin.accountStatus}</span></p>
              <p>Theme: <span className="text-cyan-primary font-semibold">{theme}</span></p>
            </div>
          </div>

          {/* Actions Card */}
          <div className={`backdrop-blur-lg p-6 rounded-xl ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white border border-gray-200 shadow-lg'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
            <div className="space-y-2">
              {admin.role === 'superadmin' && (
                <button 
                  onClick={() => navigate('/create-admin')}
                  className="w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-primary text-white hover:shadow-lg"
                >
                  <UserPlus size={20} />
                  Create New Admin
                </button>
              )}
              <button 
                onClick={() => navigate('/admin-list')}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-cyan-primary/20 text-cyan-primary hover:bg-cyan-primary/30'
                    : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                }`}
              >
                Manage Admins
              </button>
              <button className={`w-full px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
                View Requests
              </button>
            </div>
          </div>
        </div>

        {/* More content will be added here */}
        <div className={`mt-8 backdrop-blur-lg p-6 rounded-xl ${
          theme === 'dark'
            ? 'bg-white/5 border border-white/10'
            : 'bg-white border border-gray-200 shadow-lg'
        }`}>
          <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📊 Dashboard Content Coming Soon...</h3>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>This is a placeholder dashboard. More features will be added based on your Figma design.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
