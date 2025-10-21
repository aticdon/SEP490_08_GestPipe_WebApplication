import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, Moon, Bell, ChevronDown, TrendingUp, Activity, MousePointer, 
  Users as UsersIcon, BarChart3, User
} from 'lucide-react';
import authService from '../services/authService';
import { useTheme } from '../utils/ThemeContext';
import Logo from '../assets/images/Logo.png';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const adminData = localStorage.getItem('admin');
    if (adminData) {
      setAdmin(JSON.parse(adminData));
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // Mock data - will be replaced with real API data later
  const stats = {
    totalUsers: 5000,
    totalUsersGrowth: '+12% Compared to last month',
    onlineUsers: 2500,
    accuracyRate: 96.1,
    totalRequests: 115,
    requestsToday: '+56 today'
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900' 
        : 'bg-gray-100'
    }`}>
      {/* Header - Fixed Top */}
      <header className={`sticky top-0 z-50 border-b transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-4 flex items-center relative">
          {/* Logo in Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img src={Logo} alt="GestPipe" className="h-16" />
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-3 ml-auto">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all hover:scale-110 ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Notification */}
              <button className={`p-2 rounded-lg transition-all hover:scale-110 relative ${
                theme === 'dark'
                  ? 'bg-gray-700 text-cyan-primary hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}>
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-primary flex items-center justify-center text-white font-semibold">
                    {admin.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl z-50 ${
                    theme === 'dark'
                      ? 'bg-gray-800 border border-gray-700'
                      : 'bg-white border border-gray-200'
                  }`}>
                    <div className="p-3 border-b border-gray-700">
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {admin.fullName}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {admin.email}
                      </p>
                      <span className="inline-block mt-2 px-2 py-1 bg-cyan-primary/20 text-cyan-primary rounded text-xs">
                        {admin.role}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('/change-password')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Change Password
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-b-lg"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
      </header>

      {/* Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed */}
        <Sidebar theme={theme} />

        {/* Main Content - Scrollable */}
        <main className="flex-1 px-6 py-6 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Users */}
          <div className={`p-6 rounded-xl border transition-all hover:shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Users
              </h3>
              <UsersIcon className="text-cyan-primary" size={20} />
            </div>
            <p className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalUsers.toLocaleString()}
            </p>
            <p className="text-sm text-green-500">{stats.totalUsersGrowth}</p>
          </div>

          {/* Online Users */}
          <div className={`p-6 rounded-xl border transition-all hover:shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Online Users
              </h3>
              <Activity className="text-green-500" size={20} />
            </div>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {stats.onlineUsers.toLocaleString()}
            </p>
          </div>

          {/* Accuracy Rate */}
          <div className={`p-6 rounded-xl border transition-all hover:shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Accuracy Rate
              </h3>
              <TrendingUp className="text-blue-500" size={20} />
            </div>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {stats.accuracyRate}%
            </p>
          </div>

          {/* Total Requests */}
          <div className={`p-6 rounded-xl border transition-all hover:shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Requests
              </h3>
              <MousePointer className="text-purple-500" size={20} />
            </div>
            <p className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalRequests}
            </p>
            <p className="text-sm text-cyan-primary">{stats.requestsToday}</p>
          </div>
        </div>

        {/* Charts Grid - Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gender Chart */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Gender
              </h3>
              <UsersIcon className="text-cyan-primary" size={20} />
            </div>
            <div className="flex items-center justify-center h-64">
              <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                📊 Pie Chart<br/>
                <span className="text-sm">Coming soon when data available</span>
              </p>
            </div>
          </div>

          {/* Occupation Chart */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Occupation
              </h3>
              <BarChart3 className="text-cyan-primary" size={20} />
            </div>
            <div className="flex items-center justify-center h-64">
              <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                📊 Bar Chart<br/>
                <span className="text-sm">Coming soon when data available</span>
              </p>
            </div>
          </div>

          {/* Age Chart */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Age
              </h3>
              <User className="text-cyan-primary" size={20} />
            </div>
            <div className="flex items-center justify-center h-64">
              <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                📊 Bar Chart<br/>
                <span className="text-sm">Coming soon when data available</span>
              </p>
            </div>
          </div>

          {/* Other City Chart */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Other City
              </h3>
              <BarChart3 className="text-cyan-primary" size={20} />
            </div>
            <div className="flex items-center justify-center h-64">
              <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                📊 Bar Chart<br/>
                <span className="text-sm">Coming soon when data available</span>
              </p>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
