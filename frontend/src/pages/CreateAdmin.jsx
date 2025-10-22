import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, ChevronDown, Copy, Check } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import adminService from '../services/adminService';
import authService from '../services/authService';
import { useTheme } from '../utils/ThemeContext';
import Sidebar from '../components/Sidebar';
import Logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';

const CreateAdmin = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [admin, setAdmin] = useState(() => {
    const adminData = localStorage.getItem('admin');
    return adminData ? JSON.parse(adminData) : null;
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    province: ''
  });

  // Danh sách 63 tỉnh/thành Việt Nam
  const provinces = [
    'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu', 'Bắc Kạn', 'Bắc Giang', 
    'Bắc Ninh', 'Bến Tre', 'Bình Dương', 'Bình Định', 'Bình Phước', 
    'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Cần Thơ', 'Đà Nẵng', 
    'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 
    'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội', 'Hà Tĩnh', 
    'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 
    'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 
    'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 
    'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 
    'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 
    'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa', 
    'Thừa Thiên Huế', 'Tiền Giang', 'TP. Hồ Chí Minh', 'Trà Vinh', 
    'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
  ];

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.email || !formData.fullName || !formData.phoneNumber || !formData.province) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await adminService.createAdmin(
        formData.email, 
        formData.fullName,
        formData.phoneNumber,
        formData.province
      );
      setSuccess(response);
      toast.success('Admin account created successfully! 🎉');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create admin';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(success.temporaryPassword);
    setCopied(true);
    toast.success('Password copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    setSuccess(null);
    setFormData({
      email: '',
      fullName: '',
      phoneNumber: '',
      province: ''
    });
  };

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

        {/* Header */}
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
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notification */}
              <button className={`p-2 rounded-lg transition-all hover:scale-110 relative ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {admin?.fullName?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <span className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {admin?.fullName || 'Admin'}
                  </span>
                  <ChevronDown className={`w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                </button>

                {showUserDropdown && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}>
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
                      Profile
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
                      Change Password
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`w-full text-left px-4 py-2 transition-colors ${
                        theme === 'dark'
                          ? 'text-red-400 hover:bg-gray-700'
                          : 'text-red-600 hover:bg-gray-100'
                      }`}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar theme={theme} />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
              {!success ? (
                /* Create Form */
                <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm rounded-2xl border ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'} p-8`}>
                  <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Create New Admin
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="admin@example.com"
                        className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400`}
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400`}
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="0123456789"
                        className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400`}
                      />
                    </div>

                    {/* Province */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Province <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400`}
                      >
                        <option value="">Select Province</option>
                        {provinces.map((province) => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => navigate('/admin-list')}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                          theme === 'dark'
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Creating...' : 'Create Admin'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Success Message */
                <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm rounded-2xl border ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'} p-8`}>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check size={40} className="text-white" />
                    </div>
                    <h2 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Admin Created Successfully!
                    </h2>
                    <p className="text-cyan-400">
                      Please send the temporary password to the admin via email
                    </p>
                  </div>

                  <div className={`${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100/50'} rounded-xl p-6 mb-6`}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{success.admin.email}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</p>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{success.admin.fullName}</p>
                      </div>
                    </div>
                    
                    <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-lg p-4 mb-2`}>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Temporary Password</p>
                      <div className="flex items-center justify-between">
                        <code className={`text-lg font-mono font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                          {success.temporaryPassword}
                        </code>
                        <button
                          onClick={copyToClipboard}
                          className={`p-2 rounded-lg transition-all ${
                            copied 
                              ? 'bg-green-500 text-white' 
                              : theme === 'dark'
                                ? 'bg-gray-700 text-cyan-400 hover:bg-gray-600'
                                : 'bg-gray-200 text-cyan-600 hover:bg-gray-300'
                          }`}
                        >
                          {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                      ⚠️ This password will be required to change on first login
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate('/admin-list')}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Back to Admin List
                    </button>
                    <button
                      onClick={handleFinish}
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                    >
                      Create Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CreateAdmin;
