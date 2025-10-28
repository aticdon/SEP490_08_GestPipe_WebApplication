import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Bell, ChevronDown } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from '../services/authService';
import adminService from '../services/adminService';
import { useTheme } from '../utils/ThemeContext';
import Sidebar from '../components/Sidebar';
import AdminSidebar from '../components/AdminSidebar';
import Logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';

const EditProfile = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [admin, setAdmin] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    birthday: '',
    email: '',
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const adminData = localStorage.getItem('admin');
    if (adminData) {
      const parsedAdmin = JSON.parse(adminData);
      setAdmin(parsedAdmin);
      
      // Pre-fill form with current data
      setFormData({
        fullName: parsedAdmin.fullName || '',
        birthday: parsedAdmin.birthday ? parsedAdmin.birthday.split('T')[0] : '',
        email: parsedAdmin.email || '',
        phoneNumber: parsedAdmin.phoneNumber || '',
        province: parsedAdmin.province || ''
      });
    }
  }, [navigate]);

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName) {
      toast.error(t('notifications.nameRequired'));
      return;
    }

    setLoading(true);

    try {
      // Use _id from admin object
      const adminId = admin._id || admin.id;
      
      const response = await adminService.updateProfile(adminId, {
        fullName: formData.fullName,
        birthday: formData.birthday,
        phoneNumber: formData.phoneNumber,
        province: formData.province
      });

      // Update localStorage
      const updatedAdmin = {
        ...admin,
        fullName: formData.fullName,
        birthday: formData.birthday,
        phoneNumber: formData.phoneNumber,
        province: formData.province
      };
      localStorage.setItem('admin', JSON.stringify(updatedAdmin));
      setAdmin(updatedAdmin);

      toast.success(t('notifications.profileUpdated'));
      
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('notifications.failedUpdateProfile');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!admin) {
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
                      className={`w-full text-left px-4 py-2 text-red-400 transition-colors ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
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

        {/* Main Content with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {admin?.role === 'admin' ? (
            <AdminSidebar theme={theme} />
          ) : (
            <Sidebar theme={theme} />
          )}

          {/* Main Content Area */}
          <main className={`flex-1 overflow-y-auto p-8 ${
            theme === 'dark' ? 'bg-transparent' : 'bg-transparent'
          }`}>
            <div className="max-w-4xl mx-auto">
              {/* Edit Profile Form */}
              <div className={`rounded-2xl border p-10 ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <h2 className="text-3xl font-bold text-center mb-8 text-cyan-primary">
                  {t('editProfile.title')}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="flex items-center">
                    <label className={`w-48 font-semibold text-lg ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {t('editProfile.name')}
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-primary ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Date of Birthday */}
                  <div className="flex items-center">
                    <label className={`w-48 font-semibold text-lg ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {t('editProfile.birthday')}
                    </label>
                    <input
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-primary ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  {/* Gmail (disabled) */}
                  <div className="flex items-center">
                    <label className={`w-48 font-semibold text-lg ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {t('editProfile.email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className={`flex-1 px-4 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="flex items-center">
                    <label className={`w-48 font-semibold text-lg ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {t('editProfile.phone')}
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-primary ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Address (Province Dropdown) */}
                  <div className="flex items-center">
                    <label className={`w-48 font-semibold text-lg ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {t('editProfile.province')}
                    </label>
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-primary ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select province</option>
                      {provinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-8">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-8 py-3 rounded-lg bg-cyan-primary hover:bg-cyan-600 text-white font-medium transition-all ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Saving...' : t('editProfile.save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
