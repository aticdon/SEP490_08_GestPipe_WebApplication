import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify'; 
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion'; // <-- THÊM

// Icons
import { Lock, Unlock, Plus, Search as SearchIcon, Loader2, ChevronDown } from 'lucide-react';

// Services
import adminService from '../services/adminService';
import authService from '../services/authService';

// Theme Context (VẪN CẦN NÓ ĐỂ STYLE POPUP SWAL)
import { useTheme } from '../utils/ThemeContext';

// (KHÔNG IMPORT AdminLayout, Sidebar, Logo, backgroundImage)

// ==========================
// Status mapping
// ==========================
const STATUS_LABELS = ['all', 'active', 'suspended', 'inactive'];

const getStatusBadge = (status) => {
  switch (status) {
    case "active": return "bg-gradient-to-r from-green-500 to-green-400 text-white";
    case "suspended": return "bg-gradient-to-r from-red-600 to-red-500 text-white";
    case "inactive": return "bg-gradient-to-r from-gray-600 to-gray-500 text-white";
    default: return "bg-gray-600 text-white";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("vi-VN");
};

// Hiệu ứng chuyển động
const pageVariants = {
  initial: { opacity: 0, x: "20px" },
  animate: { opacity: 1, x: "0px" },
  exit: { opacity: 0, x: "-20px" },
  transition: { type: 'tween', ease: 'anticipate', duration: 0.3 }
};

// ====================================================================
// COMPONENT CHÍNH: AdminList
// ====================================================================
const AdminList = () => {
  const navigate = useNavigate();
  const { theme } = useTheme(); // Chỉ cần theme
  const { t } = useTranslation();

  // (Bỏ state layout: admin, showUserDropdown)
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // (Giữ lại error để hiển thị lỗi)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef();
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    // Vẫn check role
    const currentAdmin = authService.getCurrentUser();
    if (!currentAdmin || !['superadmin'].includes(currentAdmin.role)) {
      navigate('/user-list'); // Chuyển về user-list nếu không phải superadmin
      return;
    }
    fetchAdmins();
  }, [navigate]); // Bỏ fetchAdmins

  // (Bỏ handleLogout)

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllAdmins();
      setAdmins(response.admins || []);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('notifications.failedLoadAdmins');
      setError(errorMsg); // Set state lỗi
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // ===== LOGIC LOCK/UNLOCK (NÂNG CẤP POPUP KÍNH MỜ) =====
  const handleToggleStatus = async (adminId, currentStatus) => {
    const actionText = currentStatus === 'active' ? t('alerts.suspendTitle') : t('alerts.activateTitle');
    const actionMessage = currentStatus === 'active' ? t('alerts.suspendMessage') : t('alerts.activateMessage');
    const confirmText = currentStatus === 'active' ? t('alerts.yesSuspend') : t('alerts.yesActivate');
    
    // Style cho popup
    const swalConfig = {
      title: actionText,
      html: actionMessage,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus === 'active' ? '#ef4444' : '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmText,
      cancelButtonText: t('alerts.cancel'),
      
      // === STYLE KÍNH MỜ (VIỀN TRẮNG 0.5px) ===
      background: 'rgba(0,0,0,0.7)', // Nền đen mờ
      backdrop: `rgba(0,0,0,0.4) backdrop-blur-sm`, // Backdrop mờ
      width: '450px', // Kích thước nhỏ
      customClass: {
        container: 'pl-72', // <-- LỆCH VỀ BÊN PHẢI (giả định sidebar w-72)
        popup: 'font-montserrat rounded-2xl border border-white/50 bg-black/70 backdrop-blur-lg text-white', // <-- VIỀN TRẮNG (0.5px là khó, dùng 1px với opacity 50)
        title: 'text-white',
        htmlContainer: 'text-gray-300',
        confirmButton: 'font-semibold',
        cancelButton: 'font-semibold'
      }
    };

    const result = await Swal.fire(swalConfig);

    if (!result.isConfirmed) return;

    setTogglingId(adminId);
    try {
      await adminService.toggleAdminStatus(adminId);
      setAdmins(prevAdmins => 
        prevAdmins.map(admin => 
          admin._id === adminId 
            ? { ...admin, accountStatus: currentStatus === 'active' ? 'suspended' : 'active' }
            : admin
        )
      );
      
      const successMessage = currentStatus === 'active' ? t('alerts.accountSuspended') : t('alerts.accountActivated');
      
      // Popup success (cũng cần style)
      await Swal.fire({
        title: t('alerts.success'),
        html: successMessage,
        icon: 'success',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: swalConfig.background,
        color: swalConfig.customClass.color,
        customClass: swalConfig.customClass
      });
      
    } catch (err) {
        const errorMsg = err.response?.data?.message || t('notifications.failedUpdateStatus');
        await Swal.fire({
          title: t('alerts.error'),
          text: errorMsg,
          icon: 'error',
          confirmButtonColor: '#ef4444',
          background: swalConfig.background,
          color: swalConfig.customClass.color,
          customClass: swalConfig.customClass
        });
        toast.error(errorMsg);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || admin.accountStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);


  return (
    // THÊM HIỆU ỨNG VÀO <main>
    <motion.main 
      className="p-8 font-montserrat" // <-- SỬA LẠI: Chỉ p-8
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageVariants.transition}
    >
      
      {/* KHỐI FILTER + SEARCH (ĐỒNG BỘ STYLE) */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
          
          <div className="flex items-center gap-4">
            {/* Create New Admin Button */}
            <button 
              onClick={() => navigate('/create-admin')}
              className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-all shadow-lg
                          bg-gradient-to-r from-blue-600 to-cyan-500 text-white 
                          hover:from-blue-500 hover:to-cyan-400`}
            >
              <Plus size={20} />
              {t('adminList.createNew')}
            </button>
            
            {/* FILTER */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setShowFilterDropdown(s => !s)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border 
                           border-white/20 bg-black/50 backdrop-blur-sm 
                           text-gray-200 hover:text-white hover:border-cyan-400 
                           focus:outline-none focus:border-cyan-400 transition"
              >
                <span className="capitalize">
                  {t(`adminList.${filterStatus}`)}
                </span>
                <ChevronDown size={18} />
              </button>
              
              {showFilterDropdown && (
                <div
                  className="absolute top-full mt-2 w-48 rounded-lg shadow-xl z-50 
                             bg-gray-800 border border-gray-600 overflow-hidden"
                >
                  {STATUS_LABELS.map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        setFilterStatus(st);
                        setShowFilterDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-200 
                                 hover:bg-white/10 capitalize transition-colors"
                    >
                      {t(`adminList.${st}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEARCH */}
          <div className="relative w-full max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
            <input
              type="text"
              placeholder={t('adminList.searchAdmin')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 
                         bg-black/50 backdrop-blur-sm text-white 
                         font-montserrat text-sm placeholder:text-gray-500 
                         focus:outline-none focus:border-cyan-400"
            />
          </div>
      </div>
      
      {/* CONTAINER BẢNG (ĐỒNG BỘ STYLE) */}
      <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl 
                    overflow-hidden overflow-x-auto
                    max-h-[75vh] overflow-y-auto 
                    scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 size={48} className="text-cyan-500 animate-spin" />
            <p className="text-lg font-medium text-cyan-500 mt-4">{t('adminList.loading')}</p>
          </div>
        ) : error ? ( 
            <div className="flex flex-col items-center justify-center h-96">
              <p className="text-lg font-medium text-red-400">{error}</p>
            </div>
        ) : (
          <table className="w-full min-w-[900px] table-auto">
            
            <thead className="sticky top-0 bg-gradient-table-header from-header-start-gray to-header-end-gray text-white z-10">
              <tr>
                {/* Bỏ % width, để table-auto tự tính */}
                <th className="px-6 py-4 font-montserrat font-bold text-left text-sm">{t('adminList.name')}</th>
                <th className="px-6 py-4 font-montserrat font-bold text-left text-sm">{t('adminList.email')}</th>
                <th className="px-6 py-4 font-montserrat font-bold text-left text-sm whitespace-nowrap">{t('adminList.phone')}</th>
                <th className="px-6 py-4 font-montserrat font-bold text-left text-sm whitespace-nowrap">{t('adminList.createDate')}</th>
                <th className="px-6 py-4 font-montserrat font-bold text-left text-sm whitespace-nowrap">{t('adminList.status')}</th>
                <th className="px-6 py-4 font-montserrat font-bold text-left text-sm whitespace-nowrap">{t('adminList.action')}</th>
              </tr>
            </thead>
            
            <tbody className="font-montserrat">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    {t('adminList.noAdmins')}
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin, i) => (
                  <tr 
                    key={admin._id} 
                    className={`border-b border-table-border-dark hover:bg-table-row-hover transition-colors
                                ${i % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}`}
                  >
                    <td className="px-6 py-4 text-gray-200 text-sm truncate">{admin.fullName}</td>
                    <td className="px-6 py-4 text-gray-200 text-sm truncate">{admin.email}</td>
                    <td className="px-6 py-4 text-gray-200 text-sm whitespace-nowrap">{admin.phoneNumber || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-200 text-sm whitespace-nowrap">{formatDate(admin.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize
                        ${getStatusBadge(admin.accountStatus)}`}>
                        {t(`adminList.${admin.accountStatus}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(admin._id, admin.accountStatus)}
                        disabled={togglingId === admin._id}
                        className={`p-2 rounded-full text-white hover:opacity-80 transition
                                   ${togglingId === admin._id ? 'cursor-not-allowed' : ''}
                                   ${admin.accountStatus === 'active' 
                                     ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500' // Nút Active (Unlock)
                                     : 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500' // Nút Inactive/Suspended (Lock)
                                   }`}
                        title={admin.accountStatus === 'active' ? t('alerts.suspendTitle') : t('alerts.activateTitle')}
                      >
                        {togglingId === admin._id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : admin.accountStatus === 'active' ? (
                          <Unlock size={18} />
                        ) : (
                          <Lock size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
    </motion.main>
  );
};

export default AdminList;