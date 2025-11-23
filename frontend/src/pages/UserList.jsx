import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2'; 
import { motion } from 'framer-motion'; 
import { 
  Lock, Unlock, Search as SearchIcon, ChevronDown, Eye, Loader2, X, Users, Filter, UserCheck, UserX,
  Mail, Phone, Calendar
} from 'lucide-react'; 
// Services
import authService from '../services/authService';
import userService from '../services/userService';
// Theme Context
import { useTheme } from '../utils/ThemeContext'; 

// Status mapping
const STATUS_MAP = {
  inactive: "inactive",
  activeonline: "online",
  activeoffline: "offline",
  pending: "inactive",
  blocked: "blocked", 
};

const STATUS_LABELS = ['all', 'online', 'offline', 'inactive', 'blocked'];

const getStatusBadge = (status) => {
  switch (status) {
    case "online": return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "offline": return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    case "blocked": return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "inactive": return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    default: return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
  }
};

// === POPUP DETAIl
const InfoRow = ({ label, value }) => (
  <tr>
    <td
      className="py-2 font-bold text-base text-gray-900 dark:text-white whitespace-nowrap text-left pr-6 align-top"
      style={{ fontFamily: 'Montserrat', minWidth: 150 }}
    >
      {label}:
    </td>
    <td
      className="py-2 font-normal text-base text-gray-700 dark:text-white text-left pl-3 break-words"
      style={{ fontFamily: 'Montserrat' }}
    >
      {value || "-"}
    </td>
  </tr>
);

const UserDetailPopup = ({ show, user, onClose, onLockToggle }) => {
  const popupRef = useRef();
  const [togglingLock, setTogglingLock] = useState(false);
  const { t } = useTranslation();
  const { theme } = useTheme(); // Add theme hook

  const formatDate = (date) => {
    if (!date) return t('common.notAvailable');
    const d = new Date(date);
    return isNaN(d.getTime()) ? t('common.notAvailable') : d.toLocaleDateString("vi-VN");
  };

  const mapStatusDetail = (status) => {
    switch (status) {
      case "activeonline": return t('userList.activeOnline');
      case "activeoffline": return t('userList.activeOffline');
      case "inactive": return t('userList.inactive');
      case "blocked": return t('userList.blocked');
      case "pending": return t('userList.pending');
      default: return status;
    }
  };

  useEffect(() => {
    if (!show) return;
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [show, onClose]);

  const handleInternalLockToggle = async () => {
    setTogglingLock(true);
    await onLockToggle(user.id, user.status === 'blocked');
    setTogglingLock(false);
    onClose(); 
  };

  return (
    <div 
      className={`fixed z-[999] inset-0 flex items-center justify-center bg-black/85 font-montserrat 
                  transition-opacity duration-300 ease-in-out 
                  pl-72 
                  ${show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.9 }}
        transition={{ type: 'tween', ease: 'anticipate', duration: 0.3 }}
        className="w-full max-w-2xl bg-white/90 dark:bg-black/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/40 shadow-xl 
                   flex flex-col relative"
        style={{ minHeight: "550px", maxHeight: '90vh' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-colors
                     text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white z-20"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {user ? (
          <>
            <div className="px-10 py-10 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
              <table className="w-full" style={{ tableLayout: "fixed" }}>
                <tbody>
                  <tr>
                    <td
                      className="align-top pr-10"
                      rowSpan={10}
                      style={{
                        width: "220px",
                        verticalAlign: "top",
                      }}
                    >
                      <div className="w-48 h-48 rounded-full bg-gray-200 dark:bg-gray-300 flex items-center justify-center overflow-hidden border-2 border-gray-300 dark:border-gray-200 shadow-xl mt-2">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <svg
                            width="120"
                            height="120"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="text-gray-400"
                          >
                            <circle cx="12" cy="8" r="8" fill="#d1d5db" />
                            <ellipse cx="12" cy="18" rx="10" ry="6.5" fill="#bdbdbd" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <InfoRow label={t('profile.name')} value={user.name} />
                  </tr>
                  <tr><InfoRow label={t('profile.dateOfBirth')} value={formatDate(user.birthDate)} /></tr>
                  <tr><InfoRow label={t('profile.email')} value={user.email} /></tr>
                  <tr><InfoRow label={t('profile.phone')} value={user.phoneNumber} /></tr>
                  <tr><InfoRow label={t('profile.address')} value={user.address} /></tr>
                  <tr><InfoRow label={t('userList.company')} value={user.company} /></tr>
                  <tr><InfoRow label={t('userList.education')} value={user.education} /></tr>
                  <tr><InfoRow label={t('profile.createdAt')} value={formatDate(user.createdDate)} /></tr>
                  <tr><InfoRow label={t('profile.status')} value={mapStatusDetail(user.status)} /></tr>
                </tbody>
              </table>
            </div>
            
            <div className="flex-shrink-0 px-10 pb-6 pt-4 border-t border-white/0">
              <button
                className="block w-32 mx-auto px-6 py-2 rounded-xl font-semibold text-base text-white shadow 
                           transition-all duration-200 ease-in-out
                           bg-gradient-to-r from-red-600 to-red-700 
                           hover:from-red-700 hover:to-red-800"
                onClick={onClose}
              >
                {t('userList.close')}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 size={48} className="text-cyan-500 animate-spin" />
            <p className="text-lg font-medium text-cyan-500 mt-4">{t('userList.loadingUserDetails')}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Biến cho hiệu ứng chuyển động
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { type: 'tween', ease: 'easeOut', duration: 0.3 }
};

// ====================================================================
// COMPONENT CHÍNH: UserList
// ====================================================================
const UserList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme(); 

  const getDisplayDate = (dateStr) => {
    if (!dateStr) return t('common.notAvailable');
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? t('common.notAvailable') : d.toLocaleDateString("vi-VN");
  };

  // State
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(); 
  const [togglingId, setTogglingId] = useState(null);
  
  // State cho Popup
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [loadingPopup, setLoadingPopup] = useState(false);

  useEffect(() => {
    const currentAdmin = authService.getCurrentUser();
    if (!currentAdmin || !['admin', 'superadmin'].includes(currentAdmin.role)) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await userService.fetchAllUsers();
      const mapped = data.map(u => ({
        id: u._id || u.id,
        email: u.email,
        phoneNumber: u.phoneNumber || u.phone_number || "-",
        createDate: u.createdDate || u.created_at,
        status: STATUS_MAP[u.status] || "inactive",
        isLocked: u.status === "blocked",
      }));
      setUsers(mapped);
    } catch {
      toast.error(t('userList.failedToLoadUsers'));
    }
  }, []);

  // LOCK / UNLOCK (VỚI POPUP KÍNH MỜ)
  const handleToggleLock = async (userId, isLocked) => {
    const swalConfig = {
      title: isLocked ? t('userList.unlockUserTitle') : t('userList.lockUserTitle'),
      html: isLocked ? t('userList.unlockConfirmText') : t('userList.lockConfirmText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: isLocked ? t('userList.yesUnlock') : t('userList.yesLock'),
      cancelButtonText: t('userList.cancel'),
      confirmButtonColor: isLocked ? '#10b981' : '#ef4444',
      cancelButtonColor: '#6b7280',
      
      background: 'rgba(0,0,0,0.7)',
      backdrop: `rgba(0,0,0,0.4) backdrop-blur-sm`,
      width: '450px',
      customClass: {
        container: 'pl-72',
        popup: 'font-montserrat rounded-2xl border border-white/20 bg-black/70 backdrop-blur-lg text-white',
        title: 'text-white',
        htmlContainer: 'text-gray-300',
        confirmButton: 'font-semibold',
        cancelButton: 'font-semibold'
      }
    };

    const result = await Swal.fire(swalConfig);
    if (!result.isConfirmed) return;

    setTogglingId(userId);
    try {
      if (isLocked) {
        await userService.unlockUser(userId);
        toast.success(t('userList.userUnlocked'));
      } else {
        await userService.lockUser(userId);
        toast.success(t('userList.userLocked'));
      }
      fetchUsers(); // Tải lại danh sách
    } catch {
      toast.error(t('userList.failedToUpdateStatus'));
    } finally {
      setTogglingId(null);
    }
  };

  // MỞ POPUP DETAIL
  const handleShowDetail = async (userId) => {
    setLoadingPopup(true);
    setShowDetailPopup(true);
    try {
      const detail = await userService.fetchUserById(userId); 
      setSelectedUserDetail(detail);
    } catch {
      toast.error(t('userList.cannotLoadUserDetail'));
      setShowDetailPopup(false);
    }
    setLoadingPopup(false);
  };

  // (getVisibleUsers và useEffect của filterDropdownRef giữ nguyên)
  const getVisibleUsers = useCallback(() => {
    return users.filter(u => {
      const keyword = searchTerm.toLowerCase();
      const matchSearch =
        u.email.toLowerCase().includes(keyword) ||
        u.phoneNumber.toLowerCase().includes(keyword);
      const dataStatus = filterType === 'locked' ? 'blocked' : filterType;
      const matchFilter = filterType === "all" || u.status === dataStatus;
      return matchSearch && matchFilter;
    });
  }, [users, searchTerm, filterType]);

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
    <> {/* <-- BỌC TRONG FRAGMENT */}
      <motion.main 
        className="flex-1 h-full overflow-hidden p-6 md:p-8 font-montserrat flex flex-col gap-4"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageVariants.transition}
      >
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold text-black dark:text-white mb-2 flex items-center gap-3">
              <Users className="text-cyan-600 dark:text-cyan-400" size={32} />
              {t('userList.title', { defaultValue: 'User Management' })}
            </h1>
            <p className="text-gray-700 dark:text-gray-400 text-base font-medium">{t('userList.subtitle', { defaultValue: 'Manage system users and permissions' })}</p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col md:flex-row gap-3 bg-white/60 dark:bg-black/40 p-3 rounded-2xl backdrop-blur-md z-20 shrink-0 border border-gray-200 dark:border-white/10">
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={t('userList.searchUser')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 
                        bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white 
                        font-montserrat text-sm placeholder:text-gray-500 
                        focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Filter */}
          <div className="relative min-w-[160px]" ref={filterDropdownRef}>
            <button
              onClick={() => setShowFilterDropdown(s => !s)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl border 
                        border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 
                        text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20
                        focus:outline-none transition-all"
            >
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-cyan-600 dark:text-cyan-400" />
                <span className="capitalize text-sm font-medium">
                  {filterType === "all" ? t('userList.allUsers') : t(`userList.${filterType}`)}
                </span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showFilterDropdown && (
              <div className="absolute top-full right-0 mt-2 w-full rounded-xl shadow-2xl z-50 
                            bg-white dark:bg-gray-900/95 border border-gray-200 dark:border-white/10 backdrop-blur-xl overflow-hidden">
                {STATUS_LABELS.map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setFilterType(st);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2
                              ${filterType === st ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    {st === 'online' && <UserCheck size={14} />}
                    {st === 'offline' && <UserX size={14} />}
                    {st === 'blocked' && <Lock size={14} />}
                    {st === 'inactive' && <UserX size={14} />}
                    {st === 'all' && <Filter size={14} />}
                    <span className="capitalize">{t(`userList.${st}`)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* CONTAINER BẢNG */}
        <div className="bg-white/60 dark:bg-black/50 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 shadow-xl overflow-hidden flex-1 flex flex-col">
          
          {/* Div cho Header (Không cuộn) */}
          <div className="flex-shrink-0 overflow-y-hidden bg-gray-200 dark:bg-header-end-gray" style={{ scrollbarGutter: 'stable' }}>
            <table className="w-full table-fixed">
              <thead className="bg-gray-200 dark:bg-gradient-table-header dark:from-header-start-gray dark:to-header-end-gray text-black dark:text-white border-b border-gray-300 dark:border-white/10">
                <tr>
                  <th className="px-4 py-5 text-left text-sm font-extrabold uppercase tracking-wider whitespace-nowrap w-[25%]">{t('userList.email')}</th>
                  <th className="px-4 py-5 text-left text-sm font-extrabold uppercase tracking-wider whitespace-nowrap w-[20%]">{t('userList.phoneNumber')}</th>
                  <th className="px-4 py-5 text-left text-sm font-extrabold uppercase tracking-wider whitespace-nowrap w-[20%]">{t('userList.createDate')}</th>
                  <th className="px-4 py-5 text-center text-sm font-extrabold uppercase tracking-wider whitespace-nowrap w-[20%]">{t('userList.status')}</th>
                  <th className="px-4 py-5 text-center text-sm font-extrabold uppercase tracking-wider whitespace-nowrap w-[15%]">{t('userList.action')}</th>
                </tr>
              </thead>
            </table>
          </div>
          
          {/* Div cho Body (Sẽ cuộn) */}
          <div
            className="overflow-y-scroll flex-1 scrollbar-thin scrollbar-track-transparent 
                        scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500"
            style={{ scrollbarGutter: 'stable' }}
          >
            <table className="w-full table-fixed">
              <tbody className="font-montserrat">
                {getVisibleUsers().map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-gray-200 dark:border-table-border-dark hover:bg-gray-100 dark:hover:bg-table-row-hover transition-colors 
                                ${i % 2 === 0 ? 'bg-gray-50 dark:bg-white/5' : 'bg-transparent'}`}
                  >
                    <td className="px-4 py-4 w-[25%] text-left">
                      <div className="flex items-center gap-2 text-black dark:text-white font-bold text-sm truncate">
                        <Mail size={14} className="text-gray-600 dark:text-gray-500 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 w-[20%] text-left">
                      <div className="flex items-center gap-2 text-gray-800 dark:text-gray-300 text-sm truncate">
                        <Phone size={14} className="text-gray-600 dark:text-gray-500 shrink-0" />
                        <span className="truncate">{u.phoneNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 w-[20%] text-left">
                      <div className="flex items-center gap-2 text-gray-800 dark:text-gray-300 text-sm truncate">
                        <Calendar size={14} className="text-gray-600 dark:text-gray-500 shrink-0" />
                        <span className="truncate">{getDisplayDate(u.createDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 w-[20%] text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize border whitespace-nowrap
                        ${getStatusBadge(u.status)}`}>
                        {t(`userList.${u.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-[15%] text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleShowDetail(u.id);
                          }}
                          className="p-2 rounded-lg transition-all duration-200 text-blue-500 dark:text-blue-400 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-300"
                          title={t('userList.viewDetails')}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleToggleLock(u.id, u.isLocked);
                          }}
                          disabled={togglingId === u.id} 
                          className={`p-2 rounded-lg transition-all duration-200
                                     ${togglingId === u.id ? 'cursor-not-allowed opacity-50' : ''}
                                     ${u.isLocked
                                       ? "text-green-500 dark:text-green-400 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-300"
                                       : "text-red-500 dark:text-red-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300" 
                                     }`}
                          title={u.isLocked ? t('userList.unlockUser') : t('userList.lockUser')}
                        >
                          {togglingId === u.id ? <Loader2 size={18} className="animate-spin"/> : (u.isLocked ? <Unlock size={18} /> : <Lock size={18} />)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {getVisibleUsers().length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                      {t('userList.noUsersFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.main>
      
      {/* POPUP Chi tiết (LUÔN RENDER) */}
      <UserDetailPopup
        show={showDetailPopup}
        user={loadingPopup ? null : selectedUserDetail} // Sửa 'detail' thành 'user'
        onClose={() => setShowDetailPopup(false)}
        onLockToggle={handleToggleLock} 
      />
    </>
  );
};

export default UserList;