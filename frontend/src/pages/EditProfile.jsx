import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// (Bỏ import Sun, Moon, Bell, ChevronDown)
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from '../services/authService';
import adminService from '../services/adminService';
import { useTheme } from '../utils/ThemeContext';
// (Bỏ import Sidebar, AdminSidebar, Logo, backgroundImage)
import { Loader2, ArrowLeft } from 'lucide-react'; // Thêm Loader, ArrowLeft
import { motion } from 'framer-motion'; // Thêm motion

// Hiệu ứng
const pageVariants = {
  initial: { opacity: 0, x: "20px" },
  animate: { opacity: 1, x: "0px" },
  exit: { opacity: 0, x: "-20px" },
  transition: { type: 'tween', ease: 'anticipate', duration: 0.3 }
};

const EditProfile = () => {
  const navigate = useNavigate();
  const { theme } = useTheme(); // Bỏ toggleTheme
  const { t } = useTranslation();
  
  // (Bỏ state showUserDropdown)
  const [admin, setAdmin] = useState(null); // Vẫn cần admin để lấy _id
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    birthday: '',
    email: '',
    phoneNumber: '',
    province: ''
  });

  // (Danh sách provinces giữ nguyên)
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

  // Check login và pre-fill form
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const adminData = authService.getCurrentUser();
    if (adminData) {
      const parsedAdmin = adminData; // authService đã parse
      setAdmin(parsedAdmin);
      
      setFormData({
        fullName: parsedAdmin.fullName || '',
        birthday: parsedAdmin.birthday ? parsedAdmin.birthday.split('T')[0] : '',
        email: parsedAdmin.email || '',
        phoneNumber: parsedAdmin.phoneNumber || '',
        province: parsedAdmin.province || ''
      });
    } else {
      navigate('/');
    }
  }, [navigate]);

  // (Bỏ handleLogout)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName) {
      toast.error(t('notifications.nameRequired'));
      return;
    }

    setLoading(true);

    try {
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
        navigate('/profile'); // Quay về trang profile
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('notifications.failedUpdateProfile');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Style input đồng bộ
  const inputStyle = `flex-1 px-4 py-2 rounded-lg border 
                      bg-gray-900/70 border-gray-700 text-white 
                      placeholder:text-gray-500 focus:outline-none focus:border-cyan-400`;
  const labelStyle = `w-48 font-semibold text-base ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`;

  // (Bỏ Loading screen cũ)
  if (!admin) {
    return (
      <main className="flex-1 overflow-hidden p-8 font-montserrat flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-cyan-500 animate-spin" />
      </main>
    );
  }

  return (
    // (Bỏ div layout)
    <motion.main 
      className="flex-1 overflow-y-auto p-8 font-montserrat flex justify-center pt-10" // Tự cuộn
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageVariants.transition}
    >
      <div className="w-full max-w-2xl">
        {/* Nút Back */}
        <button
          type="button"
          aria-label="Back to profile"
          title="Back"
          className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-lg border 
                     border-white/20 bg-black/50 backdrop-blur-sm 
                     text-gray-200 hover:text-white hover:border-cyan-400 
                     focus:outline-none focus:border-cyan-400 transition"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Edit Profile Form (Style "kính mờ") */}
        <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8 sm:p-10">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">
            {t('editProfile.title')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="flex items-center">
              <label className={labelStyle}>
                {t('editProfile.name')}
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={inputStyle}
                placeholder="Enter your name"
              />
            </div>

            {/* Date of Birthday */}
            <div className="flex items-center">
              <label className={labelStyle}>
                {t('editProfile.birthday')}
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>

            {/* Gmail (disabled) */}
            <div className="flex items-center">
              <label className={labelStyle}>
                {t('editProfile.email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className={`${inputStyle} bg-gray-600/50 border-gray-700 text-gray-400 cursor-not-allowed`}
              />
            </div>

            {/* Phone Number */}
            <div className="flex items-center">
              <label className={labelStyle}>
                {t('editProfile.phone')}
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={inputStyle}
                placeholder="Enter your phone number"
              />
            </div>

            {/* Address (Province Dropdown) */}
            <div className="flex items-center">
              <label className={labelStyle}>
                {t('editProfile.province')}
              </label>
              <select
                name="province"
                value={formData.province}
                onChange={handleChange}
                className={`${inputStyle} appearance-none`}
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
                className="px-8 py-3 rounded-lg font-medium transition-all
                           bg-gradient-to-r from-blue-600 to-cyan-500 text-white
                           hover:from-blue-500 hover:to-cyan-400
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={20} className="mx-auto animate-spin" />
                ) : (
                  t('editProfile.save')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.main>
    // (Bỏ div layout)
  );
};

export default EditProfile;