import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Bell, ChevronDown, Lock, Unlock, Plus, Search as SearchIcon, Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import adminService from '../services/adminService';
import authService from '../services/authService';
import { useTheme } from '../utils/ThemeContext';
import Sidebar from '../components/Sidebar';
import Logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';

const AdminList = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [admin, setAdmin] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [togglingId, setTogglingId] = useState(null); // Track which admin is being toggled

  // Get admin info
  useEffect(() => {
    const currentAdmin = authService.getCurrentUser();
    setAdmin(currentAdmin);
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleLogout = () => {
    toast.info(t('notifications.logoutMessage'), {
      position: "top-right",
      autoClose: 1500,
    });
    
    setTimeout(() => {
      authService.logout();
      navigate('/');
    }, 1000);
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllAdmins();
      setAdmins(response.admins || []);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('notifications.failedLoadAdmins');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    const action = currentStatus === 'active' ? 'suspend' : 'activate';
    const actionText = currentStatus === 'active' ? t('alerts.suspendTitle') : t('alerts.activateTitle');
    const actionMessage = currentStatus === 'active' ? t('alerts.suspendMessage') : t('alerts.activateMessage');
    const confirmText = currentStatus === 'active' ? t('alerts.yesSuspend') : t('alerts.yesActivate');
    
    // Show beautiful confirm dialog
    const result = await Swal.fire({
      title: actionText,
      html: actionMessage,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus === 'active' ? '#ef4444' : '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmText,
      cancelButtonText: t('alerts.cancel'),
      background: '#1f2937',
      color: '#fff',
      customClass: {
        popup: 'border border-gray-700 rounded-xl',
        title: 'text-white',
        htmlContainer: 'text-gray-300',
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    setTogglingId(adminId); // Show loading spinner for this admin

    try {
      await adminService.toggleAdminStatus(adminId);
      
      // Update local state immediately for better UX
      setAdmins(prevAdmins => 
        prevAdmins.map(admin => 
          admin._id === adminId 
            ? { ...admin, accountStatus: currentStatus === 'active' ? 'suspended' : 'active' }
            : admin
        )
      );
      
      // Show success notification
      const successMessage = currentStatus === 'active' ? t('alerts.accountSuspended') : t('alerts.accountActivated');
      await Swal.fire({
        title: t('alerts.success'),
        html: successMessage,
        icon: 'success',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: '#1f2937',
        color: '#fff',
        customClass: {
          popup: 'border border-gray-700 rounded-xl',
          title: 'text-white',
          htmlContainer: 'text-gray-300',
        }
      });
      
      const toastMessage = currentStatus === 'active' ? t('notifications.adminSuspended') : t('notifications.adminActivated');
      toast.success(toastMessage);
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('notifications.failedUpdateStatus');
      
      // Show error dialog
      await Swal.fire({
        title: t('alerts.error'),
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: '#1f2937',
        color: '#fff',
        customClass: {
          popup: 'border border-gray-700 rounded-xl',
          title: 'text-white',
          htmlContainer: 'text-gray-300',
        }
      });
      
      toast.error(errorMsg);
    } finally {
      setTogglingId(null); // Hide loading spinner
    }
  };

  // Filter admins
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || admin.accountStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => (dateString ? dateString : 'N/A');

  return (
    <div 
      className="h-screen flex flex-col relative"
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
        theme === 'dark' ? 'bg-gray-900/85' : 'bg-gray-50/85'
      }`}></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header - Fixed Top */}
        <header className={`sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="px-6 py-4 flex items-center relative">
          {/* Logo in Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img src={Logo} alt="GestPipe Logo" className="h-24" />
          </div>

          {/* Right Section - Theme, Notification, User */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700 text-yellow-400 hover:text-yellow-300' 
                  : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell */}
            <button
              className={`p-2 rounded-lg transition-all relative ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
              }`}
              title="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-blue-400 to-cyan-400'} flex items-center justify-center text-white font-bold`}>
                  {admin?.fullName?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {admin?.fullName || 'Admin'}
                </span>
                <ChevronDown size={16} />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                } py-2 z-50`}>
                  <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {admin?.fullName || 'Admin'}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {admin?.email || 'admin@gestpipe.com'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/profile')}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-cyan-primary hover:bg-gray-700'
                        : 'text-cyan-600 hover:bg-gray-100'
                    }`}
                  >
                    {t('profile.title')}
                  </button>
                  <button
                    onClick={() => navigate('/change-password')}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {t('profile.changePassword')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-red-400 hover:bg-gray-700'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {t('common.logout')}
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
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/create-admin')}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-cyan-500/50'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-cyan-400/50'
                  }`}
                >
                  <Plus size={20} />
                  {t('adminList.createNew')}
                </button>
                
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`px-6 py-3 border rounded-lg appearance-none cursor-pointer pr-10 transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 text-white border-gray-600 hover:bg-gray-700'
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <option value="all">{t('adminList.allAdmins')}</option>
                    <option value="inactive">{t('adminList.inactive')}</option>
                    <option value="active">{t('adminList.active')}</option>
                    <option value="suspended">{t('adminList.suspended')}</option>
                  </select>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <SearchIcon className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                <input
                  type="text"
                  placeholder={t('adminList.searchAdmin')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-3 border rounded-lg w-80 transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none`}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`mb-4 p-4 border rounded-lg ${
                theme === 'dark'
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {error}
              </div>
            )}

            {/* Admin Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 size={48} className={`${theme === 'dark' ? 'text-cyan-500' : 'text-blue-500'} animate-spin`} />
                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-cyan-500' : 'text-blue-500'}`}>{t('adminList.loading')}</p>
              </div>
            ) : (
              <div className={`border rounded-xl overflow-hidden backdrop-blur-sm ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
                  : 'bg-white/50 border-gray-200/50'
              }`}>
                <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                    <tr className={`border-b ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>ID</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('adminList.name')}</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('adminList.email')}</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('adminList.phone')}</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('adminList.createDate')}</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('adminList.status')}</th>
                      <th className={`px-6 py-4 text-center text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('adminList.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.length === 0 ? (
                      <tr>
                        <td colSpan="7" className={`px-6 py-12 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t('adminList.noAdmins')}
                        </td>
                      </tr>
                    ) : (
                      filteredAdmins.map((admin, index) => (
                        <tr 
                          key={admin._id} 
                          className={`border-b transition-colors ${
                            theme === 'dark'
                              ? 'border-gray-700/50 hover:bg-gray-800/30'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {String(index + 1).padStart(3, '0')}
                          </td>
                          <td className={`px-6 py-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{admin.fullName}</td>
                          <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{admin.email}</td>
                          <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{admin.phoneNumber || 'N/A'}</td>
                          <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{formatDate(admin.createdAt)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                              admin.accountStatus === 'active' 
                                ? 'bg-green-500/20 text-green-400' 
                                : admin.accountStatus === 'inactive'
                                ? theme === 'dark' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-200 text-gray-600'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {admin.accountStatus.charAt(0).toUpperCase() + admin.accountStatus.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(admin._id, admin.accountStatus)}
                              disabled={togglingId === admin._id}
                              className={`p-2 rounded-lg transition-all ${
                                togglingId === admin._id
                                  ? theme === 'dark' ? 'bg-gray-700/50 cursor-not-allowed' : 'bg-gray-200 cursor-not-allowed'
                                  : theme === 'dark' ? 'hover:bg-gray-700 hover:scale-110' : 'hover:bg-gray-100 hover:scale-110'
                              }`}
                              title={
                                togglingId === admin._id 
                                  ? 'Processing...'
                                  : admin.accountStatus === 'active' 
                                  ? 'Suspend Account' 
                                  : 'Activate Account'
                              }
                            >
                              {togglingId === admin._id ? (
                                <Loader2 size={20} className={`${theme === 'dark' ? 'text-cyan-500' : 'text-blue-500'} animate-spin`} />
                              ) : admin.accountStatus === 'active' ? (
                                <Unlock size={20} className="text-green-400 transition-transform" />
                              ) : (
                                <Lock size={20} className="text-red-400 transition-transform" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 flex gap-4">
              <div className={`border rounded-lg px-6 py-3 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Admins: </span>
                <span className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{admins.length}</span>
              </div>
              <div className={`border rounded-lg px-6 py-3 ${
                theme === 'dark'
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-green-50 border-green-200'
              }`}>
                <span className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Active: </span>
                <span className={`font-bold text-lg ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                  {admins.filter(a => a.accountStatus === 'active').length}
                </span>
              </div>
              <div className={`border rounded-lg px-6 py-3 ${
                theme === 'dark'
                  ? 'bg-gray-500/20 border-gray-500/50'
                  : 'bg-gray-100 border-gray-300'
              }`}>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Inactive: </span>
                <span className={`font-bold text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  {admins.filter(a => a.accountStatus === 'inactive').length}
                </span>
              </div>
            </div>
          </main>
        </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ zIndex: 9999 }}
      />
      </div>
    </div>
  );
};

export default AdminList;
