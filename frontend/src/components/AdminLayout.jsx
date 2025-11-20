// src/components/AdminLayout.jsx

import React, { useState, useEffect, useRef } from 'react';
// ===== THAY ĐỔI 1: Import thêm useLocation và Outlet =====
import { useNavigate, Outlet, useLocation } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import Logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';
import { Sun, Moon, Bell, ChevronDown, User } from 'lucide-react';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import { useTheme } from '../utils/ThemeContext';
import authService from '../services/authService'; 
// ===== THAY ĐỔI 2: Import framer-motion =====
import { AnimatePresence, motion } from 'framer-motion';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); 
  const { t } = useTranslation();
  const location = useLocation(); // <-- Lấy location để biết khi nào URL thay đổi

  // STATE NỘI BỘ CỦA LAYOUT
  const [admin, setAdmin] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef();

  // Tự lấy thông tin admin
  useEffect(() => {
    const currentAdmin = authService.getCurrentUser();
    if (currentAdmin) {
      setAdmin(currentAdmin);
    } else {
      navigate('/'); // Nếu không có, đá về login
    }
  }, [navigate]);

  // Tự xử lý đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setShowUserDropdown(false);
      }
    };
    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  // Tự xử lý logout
  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // Nếu chưa có admin (đang fetch), hiển thị loading
  if (!admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Layout...</div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        className={`absolute inset-0 ${
          theme === "dark" ? "bg-black/80" : "bg-white/80"
        } pointer-events-none`}
      />

      <div className="relative z-10 h-full flex flex-col">
        <ToastContainer theme={theme === "dark" ? "dark" : "light"} />
        
        {/* HEADER */}
        <header
          className={`sticky top-0 z-50 border-b backdrop-blur-lg ${
            theme === "dark"
              ? "bg-black/30 border-white/25"
              : "bg-white/30 border-gray-200"
          }`}
        >
          {/* ... (Toàn bộ code Header giữ nguyên) ... */}
          <div className="px-6 py-6 flex items-center relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none select-none">
              <img src={Logo} alt="GestPipe" className="h-20" />
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-200 ease-in-out ${
                  theme === "dark"
                    ? "text-gray-100 hover:bg-white/10"
                    : "text-yellow-400 hover:bg-black/10"
                }`}
              >
                {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button
                className={`p-2 rounded-lg relative transition-all duration-200 ease-in-out ${
                  theme === "dark"
                    ? "text-gray-100 hover:bg-white/10"
                    : "text-gray-700 hover:bg-black/10"
                }`}
                title="Noti"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setShowUserDropdown((s) => !s)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out ${
                    theme === "dark"
                      ? "text-gray-300 hover:bg-white/10"
                      : "text-gray-700 hover:bg-black/10"
                  }`}
                >
                  <User size={20} className={theme === "dark" ? "text-gray-100" : "text-gray-700"} />
                  <ChevronDown size={16} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
                </button>
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl z-50 
                              transition-all duration-200 ease-in-out 
                              origin-top-right ${
                    theme === "dark"
                      ? "bg-gradient-table-header from-header-start-gray to-header-end-gray border border-white/25"
                      : "bg-white border border-gray-300"
                  } ${
                    showUserDropdown
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="p-3 border-b border-white/20">
                    <p className={`font-montserrat font-semibold text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {admin.fullName}
                    </p>
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      {admin.email}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-700 text-gray-100 rounded text-xs">
                      {admin.role}
                    </span>
                  </div>
                  <button
                    onClick={() => { setShowUserDropdown(false); navigate('/profile'); }}
                    className={`w-full text-left px-4 py-2 text-base font-medium transition-colors ${
                      theme === "dark" ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {t("profile.title") || "Profile"}
                  </button>
                  <button
                    onClick={() => { setShowUserDropdown(false); navigate('/change-password'); }}
                    className={`w-full text-left px-4 py-2 text-base font-medium transition-colors ${
                      theme === "dark" ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {t("profile.changePassword") || "Change Password"}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-base font-medium text-red-500 hover:bg-red-500/10 rounded-b-lg"
                  >
                    {t("common.logout") || "Logout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* SIDEBAR + MAIN CONTENT */}
        <div className="flex flex-1 overflow-hidden">
          {admin.role === "superadmin" ? (
            <Sidebar theme={theme} onLogout={handleLogout} />
          ) : (
            <AdminSidebar theme={theme} onLogout={handleLogout} />
          )}
          
          {/* ===== THAY ĐỔI 3: BỌC OUTLET BẰNG ANIMATION ===== */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname} // Key giúp AnimatePresence biết trang đã đổi
              className="flex-1 flex flex-col overflow-hidden" // Đảm bảo div chiếm hết không gian
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
          {/* ================================================ */}
          
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;