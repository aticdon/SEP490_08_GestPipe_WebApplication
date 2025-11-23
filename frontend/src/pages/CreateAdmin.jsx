import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Plus, Loader2, ArrowLeft } from 'lucide-react'; // <-- THÊM ICON
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import adminService from '../services/adminService';
import authService from '../services/authService';
import { useTheme } from '../utils/ThemeContext';
import { motion } from 'framer-motion'; // <-- THÊM

// (Bỏ import Sidebar, Logo, backgroundImage, Sun, Moon, Bell, ChevronDown)

// Hiệu ứng chuyển động
const pageVariants = {
  initial: { opacity: 0, x: "20px" },
  animate: { opacity: 1, x: "0px" },
  exit: { opacity: 0, x: "-20px" },
  transition: { type: 'tween', ease: 'anticipate', duration: 0.3 }
};

const CreateAdmin = () => {
  const navigate = useNavigate();
  const { theme } = useTheme(); // Chỉ cần theme
  const { t } = useTranslation();
  // (Bỏ state admin, showUserDropdown)
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
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

  // Check login (vẫn cần để check role)
  useEffect(() => {
    const currentAdmin = authService.getCurrentUser();
    if (!currentAdmin || !['superadmin'].includes(currentAdmin.role)) {
      navigate('/user-list');
    }
  }, [navigate]);

  // (Bỏ handleLogout)

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      // Validation for phoneNumber: only numbers, max 10 digits
      if (value.length > 10) {
        return; // Don't update if exceeds max length
      }
      // Allow only numbers
      const numberOnlyRegex = /^[0-9]*$/;
      if (!numberOnlyRegex.test(value)) {
        return; // Don't update if contains non-numeric characters
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.fullName || !formData.phoneNumber || !formData.province) {
      toast.error(t('notifications.fillRequiredFields'));
      return;
    }

    // Additional validation for phoneNumber
    if (formData.phoneNumber.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    const numberOnlyRegex = /^[0-9]+$/;
    if (!numberOnlyRegex.test(formData.phoneNumber)) {
      toast.error('Phone number can only contain numbers');
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
      toast.success(t('notifications.adminCreated'));
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('notifications.failedCreateAdmin');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
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

  // Input style đồng bộ
  const inputStyle = `w-full px-4 py-3 rounded-lg border 
                      bg-gray-900/70 border-gray-700 text-white 
                      placeholder:text-gray-500 focus:outline-none focus:border-cyan-400`;
  
  const labelStyle = `block text-sm font-medium mb-2 text-gray-300`;

  return (
    // (Bỏ div layout cũ)
    <motion.main 
      className="flex-1 overflow-y-auto p-8 font-montserrat flex flex-col items-center justify-start pt-10"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageVariants.transition}
    >
      {/* Nút Back */}
      <button
        type="button"
        aria-label="Back to admin list"
        title="Back"
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-lg border 
                   border-white/20 bg-black/50 backdrop-blur-sm 
                   text-gray-200 hover:text-white hover:border-cyan-400 
                   focus:outline-none focus:border-cyan-400 transition"
        onClick={() => navigate('/admin-list')}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="w-full max-w-2xl">
        {!success ? (
          /* Create Form */
          <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-white">
              {t('createAdmin.title')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className={labelStyle}>
                  {t('createAdmin.email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className={inputStyle}
                />
              </div>

              {/* Full Name */}
              <div>
                <label className={labelStyle}>
                  {t('createAdmin.fullName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={inputStyle}
                />
              </div>

              {/* Phone Number */}
              <div className="flex flex-col">
                <div className="flex items-center">
                  <label className={labelStyle}>
                    {t('createAdmin.phoneNumber')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="0123456789"
                    className={inputStyle}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <span className={`text-xs ${formData.phoneNumber.length !== 10 ? 'text-red-400' : 'text-green-400'}`}>
                    {formData.phoneNumber.length}/10 digits
                  </span>
                </div>
              </div>

              {/* Province */}
              <div>
                <label className={labelStyle}>
                  {t('createAdmin.province')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className={`${inputStyle} appearance-none`}
                >
                  <option value="">{t('createAdmin.selectProvince')}</option>
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
                  className="flex-1 py-3 rounded-lg font-semibold transition-all 
                             bg-gray-600 text-white hover:bg-gray-500"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg 
                             hover:from-blue-500 hover:to-cyan-400
                             transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 size={20} className="mx-auto animate-spin" />
                  ) : (
                    t('createAdmin.createButton')
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Success Message */
          <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-white">
                {t('createAdmin.successTitle')}
              </h2>
              <p className="text-cyan-400">
                {t('createAdmin.accountCreated')}
              </p>
            </div>

            <div className="bg-gray-900/70 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">{t('createAdmin.email')}</p>
                  <p className="font-semibold text-white">{success.admin.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('createAdmin.fullName')}</p>
                  <p className="font-semibold text-white">{success.admin.fullName}</p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4 mb-2">
                <p className="text-sm text-gray-400 mb-2">{t('createAdmin.tempPassword')}</p>
                <code className="block text-lg font-mono font-bold text-cyan-400">
                  {/* Vẫn ẩn password cho an toàn */}
                  {'*'.repeat(success?.temporaryPassword?.length || 10)}
                </code>
              </div>
              <p className="text-xs text-gray-500">
                ⚠️ {t('createAdmin.importantNote')}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/admin-list')}
                className="flex-1 py-3 rounded-lg font-semibold transition-all 
                           bg-gray-600 text-white hover:bg-gray-500"
              >
                {t('createAdmin.backToList')}
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg 
                           hover:from-blue-500 hover:to-cyan-400 transition-all"
              >
                {t('createAdmin.createAnother')}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.main>
  );
};

export default CreateAdmin;