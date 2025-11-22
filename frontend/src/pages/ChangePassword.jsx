import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2 } from 'lucide-react'; // Bỏ các icon Header
import { toast, ToastContainer } from 'react-toastify'; // Chỉ cần ToastContainer
import 'react-toastify/dist/ReactToastify.css';
import authService from '../services/authService';
import { useTheme } from '../utils/ThemeContext';
import Logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';
import { motion } from 'framer-motion'; // Thêm motion 

// Hiệu ứng
const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1.0 },
  transition: { type: 'tween', ease: 'anticipate', duration: 0.3 }
};

const ChangePassword = () => {
  const navigate = useNavigate();
  const { theme } = useTheme(); // Bỏ toggleTheme
  const { t } = useTranslation();
  
  // (Bỏ state showUserDropdown)
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Check login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const adminData = authService.getCurrentUser();
    if (adminData) {
      setAdmin(adminData);
    } else {
      navigate('/'); // Failsafe
    }
  }, [navigate]);

  // (Bỏ handleLogout, AdminLayout sẽ tự lo)

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Use flushSync to force synchronous update and maintain focus
    flushSync(() => {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    });
    
    // Ensure focus is maintained after synchronous update
    const input = document.querySelector(`input[name="${name}"]`);
    if (input && document.activeElement !== input) {
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, []);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error(t('notifications.fillAllFields'));
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error(t('notifications.passwordMinLength'));
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('notifications.passwordsNotMatch'));
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(formData.oldPassword, formData.newPassword);
      
      // Cập nhật lại localStorage nếu đây là lần đầu login
      if (admin.isFirstLogin) {
        localStorage.setItem('admin', JSON.stringify({ ...admin, isFirstLogin: false }));
      }
      
      toast.success(t('notifications.passwordChanged'));
      
      setTimeout(() => {
        if (admin?.role === 'superadmin') {
          navigate('/dashboard');
        } else {
          navigate('/user-list');
        }
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || t('notifications.failedChangePassword'));
    } finally {
      setLoading(false);
    }
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Check nếu là lần đầu login
  const isFirstLogin = admin.isFirstLogin === true;

  // Style input đồng bộ
  const inputStyle = `w-full px-4 py-3 rounded-lg border 
                      bg-gray-900/70 border-gray-700 text-white 
                      placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 pr-12`;
  const labelStyle = `block text-sm font-medium mb-2 text-gray-300`;

  // TÁCH FORM RA THÀNH COMPONENT RIÊNG
  const ChangePasswordForm = () => (
    <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8 sm:p-10 w-full max-w-lg">
      <h2 className="text-3xl font-bold text-center mb-8 text-white">
        {t('changePassword.title')}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Old Password */}
        <div>
          <label className={labelStyle}>
            {t('changePassword.oldPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.old ? "text" : "password"}
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="••••••••••"
              autoComplete="current-password"
              spellCheck="false"
              className={inputStyle}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('old')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              {showPasswords.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className={labelStyle}>
            {t('changePassword.newPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••"
              autoComplete="new-password"
              spellCheck="false"
              className={inputStyle}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className={labelStyle}>
            {t('changePassword.confirmPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••••"
              autoComplete="new-password"
              spellCheck="false"
              className={inputStyle}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 pt-4">
          {!isFirstLogin && (
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all"
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg 
                       hover:from-blue-500 hover:to-cyan-400
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={20} className="mx-auto animate-spin" />
            ) : (
              t('changePassword.submit')
            )}
          </button>
        </div>
      </form>
    </div>
  );

  // ====================================================================
  // PHẦN RENDER CHÍNH
  // ====================================================================
  
  if (isFirstLogin) {
    // Trường hợp 1: Lần đầu login (KHÔNG CÓ LAYOUT)
    return (
      <div 
        className="h-screen flex flex-col items-center justify-center p-8 relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay và ToastContainer vẫn cần */}
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/80' : 'bg-white/80'}`}></div>
        {/* ===== LỖI ĐÃ SỬA: Mtheme -> theme ===== */}
        <ToastContainer theme={theme === 'dark' ? 'dark' : 'light'} />
        
        <motion.div 
          className="relative z-10 w-full max-w-2xl flex flex-col items-center"
          initial="initial"
          animate="animate"
          variants={pageVariants}
          transition={pageVariants.transition}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={Logo} alt="GestPipe" className="h-32" />
          </div>

          {/* Warning Message */}
          <div className={`mb-6 p-4 rounded-lg border ${
            theme === 'dark'
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
              : 'bg-yellow-50 border-yellow-300 text-yellow-800'
          }`}>
            <p className="text-center font-medium">
              ⚠️ {t('changePassword.firstLoginWarning') || 'This is your first login. You must change your password to continue.'}
            </p>
          </div>

          {/* Form */}
          <ChangePasswordForm />
        </motion.div>
      </div>
    );
  }

  // Trường hợp 2: Đổi mật khẩu bình thường (CÓ LAYOUT)
  // Trang này được gọi từ <AdminLayoutRoute>
  return (
    <motion.main 
      className="flex-1 overflow-y-auto p-8 font-montserrat flex justify-center pt-10" // Tự cuộn
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageVariants.transition}
    >
      <ChangePasswordForm />
    </motion.main>
  );
};

export default ChangePassword;