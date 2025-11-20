import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Search as SearchIcon, Eye, Loader2 } from 'lucide-react';
import versionService from '../services/versionService';
import authService from '../services/authService'; 
import { motion } from 'framer-motion'; 

// ================== MAPPING UTILITY ==================
const mapStatusType = {
  "Release": "bg-gradient-to-r from-blue-500 to-cyan-400 text-white",
  "Stop": "bg-gradient-to-r from-gray-600 to-gray-500 text-white",
};

// ================== FORMAT Các trường ==================
const formatNumber = (num) =>
  typeof num === "number" ? num.toLocaleString("vi-VN") : num || "-";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
};

const formatAccuracy = (acc) => {
  if (acc === undefined || acc === null || acc === '') return "-";
  if (typeof acc === 'string' && acc.includes('%')) return acc;
  return `${acc}%`;
};

// ========= POPUP COMPONENT (Giữ nguyên) =========
const VersionDetailPopup = ({ show, detail, onClose }) => {
  const { t } = useTranslation();
  // ... (Code popup của bạn giữ nguyên, không cần sửa) ...
  const popupRef = useRef();
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

  let descriptionText = '';
  let infoRows = [];

  if (detail) {
    if (typeof detail.description === 'string') {
      descriptionText = detail.description;
    } else {
      descriptionText = detail.description?.text || '-';
    }
    infoRows = [
      { label: t('versionList.releaseName'), value: detail.releaseName },
      { label: t('versionList.version'), value: detail.version },
      { label: t('versionList.releaseDate'), value: formatDate(detail.releaseDate) },
      { label: t('versionList.numberOfDownloads'), value: formatNumber(detail.downloads) },
      { label: t('versionList.accuracy'), value: formatAccuracy(detail.accuracy) },
      { label: t('versionList.status'), value: detail.status },
    ];
  }

  return (
    <div 
      className={`fixed z-[999] inset-0 flex items-center justify-center bg-black bg-opacity-85 font-montserrat 
                  transition-opacity duration-300 ease-in-out 
                  pl-72 
                  ${show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <div
        ref={popupRef}
        className={`w-full max-w-[650px] rounded-2xl border px-5 py-7 bg-black relative
                    transition-all duration-300 ease-in-out
                    ${show ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
        style={{
          minWidth: '340px',
          borderColor: '#f6f6f6ff',
          borderWidth: '0.1px',
          boxShadow: '0px 6px 40px 16px rgba(0,0,0,0.85)',
          maxHeight: '90vh',
          overflow: 'hidden', 
        }}
      >
        {detail && (
          <>
            <div
              className="flex flex-col gap-4 pb-2 scrollbar-thin scrollbar-track-transparent 
                         scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500" 
              style={{ paddingLeft: 32, overflowY: "auto", maxHeight: '70vh' }}
            >
              {infoRows.map(({ label, value }, idx) => (
                <div
                  key={idx}
                  className="flex flex-row items-center"
                  style={{ minHeight: '32px' }}
                >
                  <span className="font-bold text-base text-white mr-2" style={{ minWidth: 210 }}>
                    {label}
                  </span>
                  <span className="text-white text-base font-normal break-words">
                    {value || '-'}
                  </span>
                </div>
              ))}
              <div className="flex flex-row items-start pt-1">
                <span className="font-bold text-base text-white mr-2" style={{ minWidth: 210 }}>
                  {t('versionList.description')}
                </span>
                <div
                  className="text-white text-base font-normal flex-1 
                             scrollbar-thin scrollbar-track-transparent 
                             scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500"
                  style={{
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                    whiteSpace: 'pre-line',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    backgroundColor: 'rgba(16,16,16,0.17)',
                    borderRadius: 4,
                    padding: '4px 8px',
                    paddingRight: '12px', 
                  }}
                >
                  <div>
                    {descriptionText}
                  </div>
                  {Array.isArray(detail.description?.features) && (
                    <ul className="text-white text-base mt-2 list-disc pl-5">
                      {detail.description.features.map((feat, idx) => (
                        <li key={idx} style={{ marginBottom: '2px' }}>
                          {feat}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <button
              className="block mx-auto mt-7 px-6 py-2 rounded-xl font-semibold text-base text-white shadow 
                         transition-all duration-200 ease-in-out
                         bg-gradient-to-r from-red-600 to-red-700 
                         hover:from-red-700 hover:to-red-800"
              style={{
                boxShadow: '0px 2px 6px rgba(130, 30, 30, 0.17)',
                width: '120px',
              }}
              onClick={onClose}
            >
              {t('versionList.close')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Biến cho hiệu ứng
const pageVariants = {
  initial: { opacity: 0, x: "20px" },
  animate: { opacity: 1, x: "0px" },
  exit: { opacity: 0, x: "-20px" },
  transition: { type: 'tween', ease: 'anticipate', duration: 0.3 }
};


// ================== MAIN COMPONENT ==================
const VersionList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [versions, setVersions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [selectedVersionDetail, setSelectedVersionDetail] = useState(null);

  useEffect(() => {
    try {
      const currentAdmin = authService.getCurrentUser();
      if (!currentAdmin || !['admin', 'superadmin'].includes(currentAdmin.role)) {
        navigate("/");
      } else {
        fetchVersions();
      }
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const fetchVersions = useCallback(async () => {
    setLoading(true); 
    try {
      const data = await versionService.fetchAllVersions();
      setVersions(Array.isArray(data) ? data : data.versions || []);
    } catch {
      toast.error(t('versionList.failedToLoadVersions'));
      setVersions([]);
    } finally {
      setLoading(false); 
    }
  }, []);

  const handleShowDetail = async (id) => {
    try {
      const detail = await versionService.fetchVersionById(id);
      setSelectedVersionDetail(detail);
      setShowDetailPopup(true);
    } catch {
      toast.error(t('versionList.cannotLoadVersionDetail'));
    }
  };

  const getVisibleVersions = useCallback(() => {
    return versions.filter((v) => {
      const keyword = searchTerm.toLowerCase();
      const matchSearch =
        (v.version?.toLowerCase().includes(keyword) ||
          v.release_name?.toLowerCase().includes(keyword));
      return matchSearch; 
    });
  }, [versions, searchTerm]);

  return (
    // ===== SỬA LẠI: Bỏ flex-1, flex-col, overflow-hidden =====
    <motion.main 
      className="p-8 font-montserrat" // <-- CHỈ CÒN PADDING
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageVariants.transition}
    >
      
      {/* ====== THANH SEARCH ====== */}
      <div className="flex justify-end mb-6 flex-shrink-0">
          <div className="relative w-full max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('versionList.searchVersion')} 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 
                         bg-black/50 backdrop-blur-sm text-white 
                         font-montserrat text-sm placeholder:text-gray-500 
                         focus:outline-none focus:border-cyan-400"
            />
          </div>
      </div>
      
      {/* ====== CONTAINER BẢNG (ĐÃ SỬA LẠI HOÀN TOÀN) ====== */}
      {/* Bỏ flex-1, flex-col. Giữ overflow-hidden */}
      <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        
        {loading ? ( 
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 size={48} className="text-cyan-500 animate-spin" />
            <p className="text-lg font-medium text-cyan-500 mt-4">{t('versionList.loadingVersions')}</p>
          </div>
        ) : (
          // Bọc bảng trong div cuộn (cho cả ngang và dọc)
          // THÊM max-h-[70vh] (70% chiều cao màn hình)
          <div className="overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600"
               style={{ maxHeight: '70vh' }}>
            
            {/* DÙNG MỘT BẢNG DUY NHẤT */}
            <table className="w-full min-w-[900px] table-auto">
              
              {/* HEADER BẢNG */}
              <thead className="sticky top-0 bg-gradient-table-header from-header-start-gray to-header-end-gray text-white z-10">
                <tr>
                  {/* Bỏ % width, để table-auto tự tính */}
                  <th className="px-6 py-4 font-montserrat font-bold text-left text-sm whitespace-nowrap">{t('versionList.versionHeader')}</th>
                  <th className="px-6 py-4 font-montserrat font-bold text-left text-sm">{t('versionList.releaseNameHeader')}</th>
                  <th className="px-6 py-4 font-montserrat font-bold text-left text-sm whitespace-nowrap">{t('versionList.releaseDateHeader')}</th>
                  <th className="px-6 py-4 font-montserrat font-bold text-left text-sm whitespace-nowrap">{t('versionList.downloadsHeader')}</th>
                  <th className="px-6 py-4 font-montserrat font-bold text-left text-sm whitespace-nowrap">{t('versionList.accuracyHeader')}</th>
                  <th className="px-6 py-4 font-montserrat font-bold text-left text-sm whitespace-nowrap">{t('versionList.statusHeader')}</th>
                  <th className="px-6 py-4 font-montserrat font-bold text-left text-sm whitespace-nowrap">{t('versionList.actionHeader')}</th>
                </tr>
              </thead>
              
              {/* BODY BẢNG */}
              <tbody className="font-montserrat">
                {getVisibleVersions().length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 font-montserrat">
                      {t('versionList.noVersionsFound')}
                    </td>
                  </tr>
                ) : (
                  getVisibleVersions().map((v, i) => (
                    <tr
                      key={v._id || v.id || i}
                      className={`border-b border-table-border-dark hover:bg-table-row-hover transition-colors
                                  ${i % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}`}
                    >
                      {/* Bỏ % width, thêm whitespace-nowrap */}
                      <td className="px-6 py-4 font-montserrat text-gray-200 text-sm whitespace-nowrap">{v.version}</td>
                      <td className="px-6 py-4 font-montserrat text-gray-200 text-sm truncate">{v.release_name}</td>
                      <td className="px-6 py-4 font-montserrat text-gray-200 text-sm whitespace-nowrap">{formatDate(v.release_date)}</td>
                      <td className="px-6 py-4 font-montserrat text-gray-200 text-sm whitespace-nowrap">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                          {formatNumber(v.downloads)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-montserrat text-gray-200 text-sm whitespace-nowrap">{formatAccuracy(v.accuracy)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-4 py-1.5 rounded-xl text-xs font-semibold
                          ${mapStatusType[v.status] || "bg-gray-600 text-white"}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleShowDetail(v._id || v.id)}
                          className="p-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white 
                                     hover:from-blue-500 hover:to-cyan-400 transition"
                          title={t('versionList.viewDetails')}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* POPUP Chi tiết (LUÔN RENDER) */}
      <VersionDetailPopup
        show={showDetailPopup}
        detail={selectedVersionDetail}
        onClose={() => setShowDetailPopup(false)}
      />
    </motion.main>
  );
};

export default VersionList;