import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Bell, ChevronDown, User as UserIcon } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from '../services/authService';
import adminService from '../services/adminService';
import { useTheme } from '../utils/ThemeContext';
import Sidebar from '../components/Sidebar';
import Logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';

const Profile = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [admin, setAdmin] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const adminData = localStorage.getItem('admin');
    if (adminData) {
      const parsedAdmin = JSON.parse(adminData);
      // Fetch fresh data from API
      fetchProfile(parsedAdmin._id || parsedAdmin.id);
    }
  }, [navigate]);

  const fetchProfile = async (adminId) => {
    try {
      setLoading(true);
      const response = await adminService.getProfile(adminId);
      setAdmin(response.admin);
      // Update localStorage with fresh data
      localStorage.setItem('admin', JSON.stringify(response.admin));
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      // Fallback to localStorage data
      const adminData = localStorage.getItem('admin');
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    toast.info('Logging out... See you soon! 👋', {
      position: "top-right",
      autoClose: 1500,
    });
    
    setTimeout(() => {
      authService.logout();
      navigate('/');
    }, 1000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
  };

  if (loading || !admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col transition-colors duration-300 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Overlay */}
      <div className={`absolute inset-0 ${
        theme === 'dark' ? 'bg-gray-900/85' : 'bg-gray-100/85'
      }`}></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        <ToastContainer theme={theme === 'dark' ? 'dark' : 'light'} />

        {/* Header - Fixed Top */}
        <header className={`sticky top-0 z-50 border-b transition-colors backdrop-blur-sm ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white/50 border-gray-200'
        }`}>
        <div className="px-6 py-4 flex items-center relative">
          {/* Logo in Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img src={Logo} alt="GestPipe" className="h-24" />
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-cyan-primary flex items-center justify-center text-white font-semibold">
                  {admin.fullName?.charAt(0).toUpperCase()}
                </div>
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {admin.fullName}
                </span>
                <ChevronDown size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
              </button>

              {showUserDropdown && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                  <button
                    onClick={() => navigate('/profile')}
                    className={`w-full text-left px-4 py-2 transition-colors ${
                      theme === 'dark'
                        ? 'text-cyan-primary hover:bg-gray-700'
                        : 'text-cyan-600 hover:bg-gray-100'
                    }`}
                  >
                    {t('profile.title')}
                  </button>
                  <button
                    onClick={() => navigate('/change-password')}
                    className={`w-full text-left px-4 py-2 transition-colors ${
                      theme === 'dark'
                        ? 'text-white hover:bg-gray-700'
                        : 'text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {t('profile.changePassword')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-b-lg"
                  >
                    {t('common.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar theme={theme} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Card */}
            <div className={`rounded-2xl border p-8 backdrop-blur-sm ${
              theme === 'dark'
                ? 'bg-gray-800/50 border-gray-700/50'
                : 'bg-white/50 border-gray-200/50'
            }`}>
              {/* Profile Info Grid */}
              <div className="space-y-6">
                {/* Name */}
                <div className="flex items-center">
                  <label className={`w-48 font-semibold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {t('profile.name')}:
                  </label>
                  <span className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {admin.fullName || 'N/A'}
                  </span>
                </div>

                {/* Date of Birth */}
                <div className="flex items-center">
                  <label className={`w-48 font-semibold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {t('profile.dateOfBirth')}:
                  </label>
                  <span className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {admin.birthday ? formatDate(admin.birthday) : 'N/A'}
                  </span>
                </div>

                {/* Gmail */}
                <div className="flex items-center">
                  <label className={`w-48 font-semibold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {t('profile.email')}:
                  </label>
                  <span className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {admin.email || 'N/A'}
                  </span>
                </div>

                {/* Phone Number */}
                <div className="flex items-center">
                  <label className={`w-48 font-semibold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {t('profile.phone')}:
                  </label>
                  <span className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {admin.phoneNumber || 'N/A'}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-center">
                  <label className={`w-48 font-semibold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {t('profile.address')}:
                  </label>
                  <span className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {admin.province || 'N/A'}
                  </span>
                </div>

                {/* Role */}
                <div className="flex items-center">
                  <label className={`w-48 font-semibold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {t('profile.role')}:
                  </label>
                  <span className="text-lg">
                    <span className="px-3 py-1 rounded-full bg-cyan-primary/20 text-cyan-primary font-semibold">
                      {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </span>
                </div>

                {/* Create date */}
                <div className="flex items-center">
                  <label className={`w-48 font-semibold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {t('profile.createdAt')}:
                  </label>
                  <span className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {admin.createdAt ? formatDate(admin.createdAt) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8 justify-end">
                <button
                  onClick={() => navigate('/change-password')}
                  className="px-6 py-2 rounded-lg bg-cyan-primary hover:bg-cyan-600 text-white font-medium transition-all"
                >
                  {t('profile.changePassword')}
                </button>
                <button
                  onClick={() => navigate('/edit-profile')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  {t('profile.edit')}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      </div>
    </div>
  );
};

export default Profile;
