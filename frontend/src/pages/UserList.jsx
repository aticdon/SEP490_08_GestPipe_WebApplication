import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2'; 
import { motion } from 'framer-motion'; 
import { Lock, Unlock, Search as SearchIcon, ChevronDown, Eye, Loader2, X } from 'lucide-react'; 
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
    case "online": return "bg-gradient-to-r from-green-500 to-green-400 text-white";
    case "offline": return "bg-gradient-to-r from-gray-600 to-gray-500 text-white";
    case "blocked": return "bg-gradient-to-r from-red-600 to-red-500 text-white";
    case "inactive": return "bg-gradient-to-r from-gray-600 to-gray-500 text-white";
    default: return "bg-gray-600 text-white";
  }
};

const getDisplayDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
};

// === POPUP DETAIl
const InfoRow = ({ label, value }) => (
  <tr>
    <td
      className="py-2 font-bold text-base text-white whitespace-nowrap text-left pr-6 align-top"
      style={{ fontFamily: 'Montserrat', minWidth: 150 }}
    >
      {label}:
    </td>
    <td
      className="py-2 font-normal text-base text-white text-left pl-3 break-words"
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
      className={`fixed z-[999] inset-0 flex items-center justify-center bg-black bg-opacity-85 font-montserrat 
                  transition-opacity duration-300 ease-in-out 
                  pl-72 
                  ${show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.9 }}
        transition={{ type: 'tween', ease: 'anticipate', duration: 0.3 }}
        className="w-full max-w-2xl bg-black/80 backdrop-blur-lg rounded-2xl border border-white/40 shadow-xl 
                   flex flex-col relative"
        style={{ minHeight: "550px", maxHeight: '90vh' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-colors
                     text-gray-400 hover:bg-white/10 hover:text-white z-20"
          aria-label="Close"
        >
        </button>

        {user ? (
          <>
            <div className="px-10 py-10 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
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
                      <div className="w-48 h-48 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-xl mt-2">
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
  initial: { opacity: 0, x: "-20px" },
  animate: { opacity: 1, x: "0px" },
  exit: { opacity: 0, x: "20px" },
  transition: { type: 'tween', ease: 'anticipate', duration: 0.3 }
};

// ====================================================================
// COMPONENT CHÍNH: UserList
// ====================================================================
const UserList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme(); 

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
        className="flex-1 overflow-hidden p-8 font-montserrat flex flex-col"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageVariants.transition}
      >
        
        {/* KHỐI FILTER + SEARCH */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setShowFilterDropdown(s => !s)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border 
                           border-white/20 bg-black/50 backdrop-blur-sm 
                           text-gray-200 hover:text-white hover:border-cyan-400 
                           focus:outline-none focus:border-cyan-400 transition"
              >
                <span className="capitalize">
                  {filterType === "all" ? t('userList.allUsers') : (filterType === 'blocked' ? t('userList.locked') : filterType)}
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
                        setFilterType(st);
                        setShowFilterDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-200 
                                 hover:bg-white/10 capitalize transition-colors"
                    >
                      {st === 'blocked' ? t('userList.locked') : st}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative w-full max-w-xs">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('userList.searchUser')}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 
                           bg-black/50 backdrop-blur-sm text-white 
                           font-montserrat text-sm placeholder:text-gray-500 
                           focus:outline-none focus:border-cyan-400"
              />
            </div>
        </div>
        
        {/* CONTAINER BẢNG */}
        <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden flex-1 flex flex-col">
          
          {/* Div cho Header (Không cuộn) */}
          <div className="flex-shrink-0">
            <table className="w-full table-fixed">
              <thead className="bg-gradient-table-header from-header-start-gray to-header-end-gray text-white">
                <tr>
                  <th className="px-5 py-5 font-montserrat font-bold text-left text-sm w-[25%]">{t('userList.email')}</th>
                  <th className="px-5 py-5 font-montserrat font-bold text-left text-sm w-[25%]">{t('userList.phoneNumber')}</th>
                  <th className="px-5 py-5 font-montserrat font-bold text-left text-sm w-[20%]">{t('userList.createDate')}</th>
                  <th className="px-5 py-5 font-montserrat font-bold text-center text-sm w-[15%]">{t('userList.status')}</th>
                  <th className="px-5 py-5 font-montserrat font-bold text-center text-sm w-[20%]">{t('userList.action')}</th>
                </tr>
              </thead>
            </table>
          </div>
          
          {/* Div cho Body (Sẽ cuộn) */}
          <div
            className="overflow-y-scroll flex-1 scrollbar-thin scrollbar-track-transparent 
                        scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500"
            style={{ scrollbarGutter: 'stable' }}
          >
            <table className="w-full table-fixed">
              <tbody className="font-montserrat">
                {getVisibleUsers().map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-table-border-dark hover:bg-table-row-hover transition-colors 
                                ${i % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}`}
                  >
                    <td className="px-5 py-4 text-gray-200 text-sm truncate w-[25%] text-left">{u.email}</td>
                    <td className="px-5 py-4 text-gray-200 text-sm w-[25%] text-left">{u.phoneNumber}</td>
                    <td className="px-5 py-4 text-gray-200 text-sm w-[20%] text-left">{getDisplayDate(u.createDate)}</td>
                    <td className="px-5 py-4 w-[15%] text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize
                        ${getStatusBadge(u.status)}`}>
                        {u.status === "blocked" ? t('userList.locked') : u.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 w-[20%] text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleShowDetail(u.id);
                          }}
                          className="p-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white 
                                     hover:from-blue-500 hover:to-cyan-400 transition"
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
                          className={`p-2 rounded-full text-white hover:opacity-80 transition
                                     ${togglingId === u.id ? 'cursor-not-allowed' : ''}
                                     ${u.isLocked
                                       ? "bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500"
                                       : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500" 
                                     }`}
                          title={u.isLocked ? t('userList.unlockUser') : t('userList.lockUser')}
                        >
                          {togglingId === u.id ? <Loader2 size={18} className="animate-spin"/> : (u.isLocked ? <Lock size={18} /> : <Unlock size={18} />)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {getVisibleUsers().length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
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