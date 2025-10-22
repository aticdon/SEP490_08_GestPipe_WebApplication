import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Bell, ChevronDown, Lock, Unlock, Search as SearchIcon } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from '../services/authService';
import { useTheme } from '../utils/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';

const UserList = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [admin, setAdmin] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Active menu state
  const [activeMenu, setActiveMenu] = useState('user');

  useEffect(() => {
    const currentAdmin = authService.getCurrentUser();
    if (!currentAdmin || currentAdmin.role !== 'admin') {
      navigate('/');
      return;
    }
    setAdmin(currentAdmin);
    
    // Load mock users
    loadMockUsers();
  }, [navigate]);

  const loadMockUsers = () => {
    const mockUsers = [
      { id: '001', name: 'Nguyen Van A', occupation: 'IT', createDate: '01-01-2025', status: 'online', isLocked: false },
      { id: '002', name: 'Doan Thi T', occupation: 'IT', createDate: '01-01-2025', status: 'online', isLocked: false },
      { id: '003', name: 'Le Trung T', occupation: 'IT', createDate: '01-01-2025', status: 'online', isLocked: false },
      { id: '004', name: 'Le Hai N', occupation: 'IT', createDate: '01-01-2025', status: 'locked', isLocked: true },
      { id: '005', name: 'Nguyen Van C', occupation: 'IT', createDate: '01-01-2025', status: 'offline', isLocked: false },
      { id: '006', name: 'Tran Anh H', occupation: 'IT', createDate: '01-01-2025', status: 'inactive', isLocked: false },
      { id: '007', name: 'Doan Thi To A', occupation: 'IT', createDate: '01-01-2025', status: 'online', isLocked: false },
      { id: '008', name: 'Le Van A', occupation: 'IT', createDate: '01-01-2025', status: 'online', isLocked: false },
      { id: '009', name: 'Nguyen Van K', occupation: 'IT', createDate: '01-01-2025', status: 'online', isLocked: false },
    ];
    setUsers(mockUsers);
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

  const handleToggleLock = (userId) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, isLocked: !user.isLocked, status: !user.isLocked ? 'locked' : 'offline' }
          : user
      )
    );
    toast.success('User status updated successfully!');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || user.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'locked':
        return 'text-red-500';
      case 'offline':
        return 'text-purple-500';
      case 'inactive':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'online': t('userList.online'),
      'locked': t('userList.locked'),
      'offline': t('userList.offline'),
      'inactive': t('userList.inactive')
    };
    return statusMap[status] || status;
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">{t('userList.loading')}</div>
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
      
      {/* Header - Fixed */}
      <header className={`sticky top-0 z-50 border-b transition-colors backdrop-blur-sm ${
        theme === 'dark' 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white/50 border-gray-200'
      }`}>
        <div className="px-6 py-4 flex items-center relative">
          {/* Logo Center */}
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
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification */}
            <button className={`p-2 rounded-lg transition-all hover:scale-110 relative ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}>
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {admin.fullName.charAt(0).toUpperCase()}
                </div>
                <ChevronDown size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} />
              </button>

              {showUserDropdown && (
                <div className={`absolute right-0 mt-2 w-48 border rounded-lg shadow-xl z-50 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {admin.fullName}
                    </div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {admin.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/profile');
                    }}
                    className={`w-full text-left px-4 py-2 transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('profile.title')}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/change-password');
                    }}
                    className={`w-full text-left px-4 py-2 transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('profile.changePassword')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-2 transition-colors ${
                      theme === 'dark'
                        ? 'text-red-400 hover:bg-gray-700'
                        : 'text-red-600 hover:bg-gray-100'
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

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed */}
        <aside className={`w-64 border-r flex-shrink-0 flex flex-col backdrop-blur-sm ${
          theme === 'dark'
            ? 'bg-gray-900/50 border-gray-800'
            : 'bg-white/50 border-gray-200'
        }`}>
          <nav className="p-4 space-y-2 flex-1">
            {/* Gestures Control */}
            <button
              onClick={() => setActiveMenu('gestures')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeMenu === 'gestures'
                  ? theme === 'dark'
                    ? 'bg-gray-800 text-cyan-400'
                    : 'bg-cyan-50 text-cyan-600'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">🎮</span>
              <span className="font-medium">{t('userList.gesturesControl')}</span>
            </button>

            {/* User - Active */}
            <button
              onClick={() => setActiveMenu('user')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeMenu === 'user'
                  ? 'bg-cyan-400 text-gray-900'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">👥</span>
              <span className="font-medium">{t('userList.user')}</span>
            </button>

            {/* Version */}
            <button
              onClick={() => setActiveMenu('version')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeMenu === 'version'
                  ? theme === 'dark'
                    ? 'bg-gray-800 text-cyan-400'
                    : 'bg-cyan-50 text-cyan-600'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">⚙️</span>
              <span className="font-medium">{t('userList.version')}</span>
            </button>
          </nav>

          {/* Language Switcher - Bottom */}
          <LanguageSwitcher />
        </aside>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all"
              >
                <span className="text-cyan-400">📋</span>
                <span>{filterType === 'all' ? t('userList.allUser') : getStatusText(filterType)}</span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showFilterDropdown && (
                <div className="absolute top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <button
                    onClick={() => { setFilterType('all'); setShowFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                  >
                    {t('userList.allUser')}
                  </button>
                  <button
                    onClick={() => { setFilterType('online'); setShowFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                  >
                    {t('userList.online')}
                  </button>
                  <button
                    onClick={() => { setFilterType('offline'); setShowFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                  >
                    {t('userList.offline')}
                  </button>
                  <button
                    onClick={() => { setFilterType('locked'); setShowFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                  >
                    {t('userList.locked')}
                  </button>
                  <button
                    onClick={() => { setFilterType('inactive'); setShowFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                  >
                    {t('userList.inactive')}
                  </button>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative w-96">
              <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('userList.searchUser')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className={`border rounded-lg overflow-hidden backdrop-blur-sm ${
            theme === 'dark'
              ? 'bg-gray-800/50 border-gray-700/50'
              : 'bg-white/50 border-gray-200/50'
          }`}>
            <table className="w-full">
              <thead className={`border-b ${
                theme === 'dark'
                  ? 'bg-gray-900/50 border-gray-700'
                  : 'bg-gray-100/50 border-gray-200'
              }`}>
                <tr>
                  <th className={`px-6 py-4 text-left font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{t('userList.id')}</th>
                  <th className={`px-6 py-4 text-left font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{t('userList.name')}</th>
                  <th className={`px-6 py-4 text-left font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{t('userList.occupation')}</th>
                  <th className={`px-6 py-4 text-left font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{t('userList.createDate')}</th>
                  <th className={`px-6 py-4 text-left font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{t('userList.status')}</th>
                  <th className={`px-6 py-4 text-left font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{t('userList.toggle')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b transition-colors ${
                      theme === 'dark'
                        ? `border-gray-700/50 hover:bg-gray-700/30 ${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-850/30'}`
                        : `border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white/30'}`
                    }`}
                  >
                    <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{user.id}</td>
                    <td className={`px-6 py-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</td>
                    <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{user.occupation}</td>
                    <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{user.createDate}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${getStatusStyle(user.status)}`}>
                        {getStatusText(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleLock(user.id)}
                        className={`p-2 rounded-lg transition-all ${
                          user.isLocked
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        {user.isLocked ? <Lock size={20} /> : <Unlock size={20} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                {t('userList.noUsers')}
              </div>
            )}
          </div>
        </main>
      </div>
      </div>
    </div>
  );
};

export default UserList;
