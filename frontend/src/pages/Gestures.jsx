// src/pages/Gestures.jsx

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Search as SearchIcon,
  X,
  ChevronDown,
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion'; 

import CameraPreview from '../components/CameraPreview'; // <-- ĐÃ THÊM LẠI
import GesturePracticeML from '../components/GesturePracticeML';
import { useTheme } from '../utils/ThemeContext';
import authService from '../services/authService';
import {
  fetchGestures,
  fetchGestureLabels,
  fetchGestureStats,
  getModelStatus,
  getModelInfo,
  testModel,
} from '../services/gestureService';

const LIMIT = 20;
const STATIC_THRESHOLD = 0.02;
const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

// ... (Component InstructionModal giữ nguyên) ...
const InstructionModal = ({ open, gesture, instruction, onClose, theme, t }) => {
  if (!open || !gesture) { return null; }
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-6 pl-72"> 
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true"></div>
      <div
        className={`relative w-full max-w-2xl rounded-2xl border bg-black/80 border-white/20 text-gray-100 shadow-2xl backdrop-blur-lg`}
      >
        <div className={`flex items-start justify-between px-6 py-4 border-b border-white/20`}>
          <div>
            <p className="text-sm uppercase tracking-wide text-cyan-400 font-semibold"> 
              {gesture.gesture_type === 'static'
                ? t('gestures.modalStatic', { defaultValue: 'Static gesture' })
                : t('gestures.modalDynamic', { defaultValue: 'Dynamic gesture' })}
            </p>
            <h2 className="text-2xl font-semibold capitalize">{gesture.pose_label}</h2>
          </div>
          <button type="button" onClick={onClose} className={`p-2 rounded-full transition-colors hover:bg-white/10 text-gray-300`} aria-label={t('gestures.modalClose', { defaultValue: 'Close' })}>
            <X size={22} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <section>
            <h3 className={`text-sm font-semibold uppercase tracking-wide text-gray-400`}>
              {t('gestures.modalInstruction', { defaultValue: 'Instruction' })}
            </h3>
            <p className="mt-2 leading-relaxed">{instruction}</p>
          </section>
          <section className={`rounded-xl border px-4 py-3 border-white/20 bg-black/30`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 text-gray-400`}>
              {t('gestures.modalMeta', { defaultValue: 'Motion summary' })}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <p>
                <span className="font-medium">{t('gestures.modalDelta', { defaultValue: 'Δx / Δy:' })}{' '}</span>
                {`${Number(gesture.delta_x || 0).toFixed(3)}, ${Number(gesture.delta_y || 0).toFixed(3)}`}
              </p>
              <p>
                <span className="font-medium">{t('gestures.modalMainAxis', { defaultValue: 'Main axis:' })}{' '}</span>
                {`${gesture.main_axis_x}, ${gesture.main_axis_y}`}
              </p>
            </div>
          </section>
        </div>
        <div className={`flex justify-end px-6 py-4 border-t border-white/20`}>
          <button type="button" onClick={onClose} className={`px-6 py-2 rounded-lg font-medium transition-colors bg-gray-700 text-gray-200 hover:bg-gray-600`}>
            {t('gestures.modalClose', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>
  );
};
// ... (Các hàm describeMotion, buildInstruction giữ nguyên) ...
const describeMotion = (gesture, t) => {
  const dx = Number(gesture.delta_x) || 0;
  const dy = Number(gesture.delta_y) || 0;
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  if (magnitude <= STATIC_THRESHOLD) {
    return t('gestures.instructionStatic', { defaultValue: 'Hold steady for about one second.', });
  }
  const isHorizontal = Math.abs(dx) >= Math.abs(dy);
  if (isHorizontal) {
    if (dx > 0) { return t('gestures.instructionMoveRight', { defaultValue: 'Sweep the hand to the right.', }); }
    if (dx < 0) { return t('gestures.instructionMoveLeft', { defaultValue: 'Sweep the hand to the left.', }); }
    return t('gestures.instructionHorizontal', { defaultValue: 'Perform a horizontal sweep.', });
  }
  if (dy > 0) { return t('gestures.instructionMoveDown', { defaultValue: 'Move the hand downward.', }); }
  if (dy < 0) { return t('gestures.instructionMoveUp', { defaultValue: 'Move the hand upward.', }); }
  return t('gestures.instructionVertical', { defaultValue: 'Perform a vertical sweep.', });
};
const buildInstruction = (gesture, t) => {
  const leftHand = t('gestures.instructionLeft', { defaultValue: 'Close left fist to start, release to finish.', });
  const fingerStates = FINGER_NAMES.map((name, index) => {
    const isOpen = Number(gesture[`right_finger_state_${index}`]) === 1;
    return `${name} ${ isOpen ? t('gestures.fingerOpen', { defaultValue: 'open' }) : t('gestures.fingerClosed', { defaultValue: 'closed' }) }`;
  }).join(', ');
  const rightHand = t('gestures.instructionRight', { defaultValue: 'Right hand: {{states}}.', states: fingerStates, });
  const motion = describeMotion(gesture, t);
  return `${leftHand} ${rightHand} ${motion}`;
};

// Hiệu ứng
const pageVariants = {
  initial: { opacity: 0, x: "20px" },
  animate: { opacity: 1, x: "0px" },
  exit: { opacity: 0, x: "-20px" },
  transition: { type: 'tween', ease: 'anticipate', duration: 0.3 }
};


const Gestures = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();

  // (State giữ nguyên)
  const [gestures, setGestures] = useState([]);
  const [labels, setLabels] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    limit: LIMIT,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeGesture, setActiveGesture] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [showMLPractice, setShowMLPractice] = useState(false);
  const [selectedPracticeGesture, setSelectedPracticeGesture] = useState(null);
  
  const labelDropdownRef = useRef();
  const typeDropdownRef = useRef();
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // (useEffect và logic giữ nguyên)
  useEffect(() => {
    const currentAdmin = authService.getCurrentUser();
    if (!currentAdmin) {
      navigate('/');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [labelsResponse, statsResponse, modelStatusResponse, modelInfoResponse] = await Promise.all([
          fetchGestureLabels(),
          fetchGestureStats(),
          getModelStatus(),
          getModelInfo().catch(() => null),
        ]);
        setLabels(labelsResponse);
        setStats(statsResponse);
        setModelStatus(modelStatusResponse);
        setModelInfo(modelInfoResponse);
      } catch (err) {
        console.error(err);
        toast.error(
          err.response?.data?.message ||
            t('gestures.toastFailedLoadMeta', {
              defaultValue: 'Failed to load gesture metadata',
            })
        );
      }
    };
    loadMetadata();
  }, [t]);

  useEffect(() => {
    const loadGestures = async () => {
      try {
        setLoading(true);
        const response = await fetchGestures({
          page: pagination.page,
          limit: LIMIT,
          poseLabel: selectedLabel === 'all' ? undefined : selectedLabel,
          gestureType: selectedType,
        });
        setGestures(response.data || []);
        setPagination(response.pagination);
        setError('');
      } catch (err) {
        console.error(err);
        const message =
          err.response?.data?.message ||
          t('gestures.toastFailedLoadGestures', {
            defaultValue: 'Failed to load gestures',
          });
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    loadGestures();
  }, [selectedLabel, selectedType, pagination.page, t]);
  
  const filteredGestures = useMemo(() => {
    if (!searchTerm.trim()) {
      return gestures;
    }
    const query = searchTerm.trim().toLowerCase();
    return gestures.filter((gesture) => {
      const idMatch = String(gesture.instance_id).includes(query);
      const labelMatch = String(gesture.pose_label)
        .toLowerCase()
        .includes(query);
      return idMatch || labelMatch;
    });
  }, [gestures, searchTerm]);
  const totalGestures = useMemo(() => {
    if (stats?.types) {
      return (stats.types.static || 0) + (stats.types.dynamic || 0);
    }
    if (stats?.counts?.length) {
      return stats.counts.reduce((sum, row) => sum + (row.samples || 0), 0);
    }
    return pagination.total || 0;
  }, [stats, pagination.total]);
  const uniquePoses = useMemo(() => {
    if (stats?.counts?.length) {
      return stats.counts.length;
    }
    return labels.length;
  }, [stats, labels]);
  const staticCount = stats?.types?.static || 0;
  const dynamicCount = stats?.types?.dynamic || 0;
  const averageMotion = useMemo(() => {
    if (!stats?.motionCenter) {
      return '0.000, 0.000';
    }
    const { deltaXAvg = 0, deltaYAvg = 0 } = stats.motionCenter;
    return `${deltaXAvg.toFixed(3)}, ${deltaYAvg.toFixed(3)}`;
  }, [stats]);

  const handleChangeLabel = (label) => {
    setSelectedLabel(label);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setShowLabelDropdown(false);
  };
  const handleChangeType = (type) => {
    setSelectedType(type);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setShowTypeDropdown(false);
  };
  const handleMLPractice = (gestureLabel) => {
    setSelectedPracticeGesture(gestureLabel);
    setShowMLPractice(true);
  };
  const openInstructionModal = (gesture) => {
    setActiveGesture(gesture);
  };
  const closeInstructionModal = () => setActiveGesture(null);

  const canGoPrev = pagination.page > 1;
  const canGoNext = pagination.page < pagination.pages;

  return (
    // ===== SỬA LỖI SCROLL: Bỏ overflow-hidden, Bỏ flex-col =====
    <motion.main 
      className="flex-1 overflow-y-auto p-8 font-montserrat" // <-- CHỈ CẦN overflow-y-auto
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageVariants.transition}
    >
      
      {/* KHỐI FILTER + SEARCH */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
          {/* ... (Code Filter/Search giữ nguyên) ... */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={labelDropdownRef}>
              <button
                onClick={() => setShowLabelDropdown(s => !s)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border 
                           border-white/20 bg-black/50 backdrop-blur-sm 
                           text-gray-200 hover:text-white hover:border-cyan-400 
                           focus:outline-none focus:border-cyan-400 transition"
              >
                <span className="capitalize">
                  {selectedLabel === "all" ? "All Gestures" : selectedLabel}
                </span>
                <ChevronDown size={18} />
              </button>
              
              {showLabelDropdown && (
                <div
                  className="absolute top-full mt-2 w-64 rounded-lg shadow-xl z-50 
                             bg-gray-800 border border-gray-600 overflow-hidden
                             max-h-60 overflow-y-auto 
                             scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600"
                >
                  <button
                    key="all"
                    onClick={() => handleChangeLabel('all')}
                    className="w-full text-left px-4 py-2 text-gray-200 
                               hover:bg-white/10 capitalize transition-colors"
                  >
                    All Gestures
                  </button>
                  {labels.map(st => (
                    <button
                      key={st}
                      onClick={() => handleChangeLabel(st)}
                      className="w-full text-left px-4 py-2 text-gray-200 
                                 hover:bg-white/10 capitalize transition-colors"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={typeDropdownRef}>
              <button
                onClick={() => setShowTypeDropdown(s => !s)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border 
                           border-white/20 bg-black/50 backdrop-blur-sm 
                           text-gray-200 hover:text-white hover:border-cyan-400 
                           focus:outline-none focus:border-cyan-400 transition"
              >
                <span className="capitalize">
                  {selectedType === "all" ? "All Types" : selectedType}
                </span>
                <ChevronDown size={18} />
              </button>
              
              {showTypeDropdown && (
                <div
                  className="absolute top-full mt-2 w-48 rounded-lg shadow-xl z-50 
                             bg-gray-800 border border-gray-600 overflow-hidden"
                >
                  <button onClick={() => handleChangeType('all')} className="w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10 capitalize transition-colors">All Types</button>
                  <button onClick={() => handleChangeType('static')} className="w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10 capitalize transition-colors">Static</button>
                  <button onClick={() => handleChangeType('dynamic')} className="w-full text-left px-4 py-2 text-gray-200 hover:bg-white/10 capitalize transition-colors">Dynamic</button>
                </div>
              )}
            </div>
          </div>
          <div className="relative w-full max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
            <input
              type="text"
              placeholder={t('gestures.searchPlaceholder', { defaultValue: 'Search gesture...' })}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 
                         bg-black/50 backdrop-blur-sm text-white 
                         font-montserrat text-sm placeholder:text-gray-500 
                         focus:outline-none focus:border-cyan-400"
            />
          </div>
      </div>

      {/* BỐ CỤC 2 CỘT (CAMERA | STATS) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Cột 1: Camera (Style "kính mờ") */}
        <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden p-4">
          <CameraPreview theme={theme} />
        </div>
        
        {/* Cột 2: Stats (Grid 2x2) */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard label={t('gestures.statTotal', { defaultValue: 'Total samples' })} value={totalGestures} />
          <StatCard label={t('gestures.statUnique', { defaultValue: 'Unique poses' })} value={uniquePoses} className="text-cyan-400" />
          <StatCard label={t('gestures.statStatic', { defaultValue: 'Static samples' })} value={staticCount} className="text-green-400" />
          <StatCard label={t('gestures.statDynamic', { defaultValue: 'Dynamic samples' })} value={dynamicCount} className="text-purple-400" />
        </div>
      </div>
      
      {/* CONTAINER BẢNG (Bỏ flex-1, flex-col) */}
      <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <Loader2 size={48} className="text-cyan-500 animate-spin" />
            <p className="text-lg font-medium text-cyan-500 mt-4">{t('gestures.loading')}</p>
          </div>
        ) : error ? ( 
            <div className="flex flex-col items-center justify-center h-full py-20">
              <p className="text-lg font-medium text-red-400">{error}</p>
            </div>
        ) : (
          <>
            {/* Div cho Header (SỬA LẠI: Bỏ flex-shrink-0) */}
            <div>
              <table className="w-full table-fixed">
                <thead className="bg-gradient-table-header from-header-start-gray to-header-end-gray text-white">
                  <tr>
                    <th className="px-6 py-4 font-montserrat font-bold text-left text-sm w-[10%]">{t('gestures.columnId', { defaultValue: 'ID' })}</th>
                    <th className="px-6 py-4 font-montserrat font-bold text-left text-sm w-[20%]">{t('gestures.poseLabel', { defaultValue: 'Pose Label' })}</th>
                    <th className="px-6 py-4 font-montserrat font-bold text-left text-sm w-[10%]">{t('gestures.columnType', { defaultValue: 'Type' })}</th>
                    <th className="px-6 py-4 font-montserrat font-bold text-left text-sm w-[40%]">{t('gestures.columnInstruction', { defaultValue: 'Instruction' })}</th>
                    <th className="px-6 py-4 font-montserrat font-bold text-left text-sm w-[20%]">{t('gestures.columnActions', { defaultValue: 'Actions' })}</th>
                  </tr>
                </thead>
              </table>
            </div>
            
            {/* Div cho Body (SỬA LẠI: Bỏ overflow-y-auto, flex-1) */}
            <div>
              <table className="w-full table-fixed">
                <tbody className="font-montserrat">
                  {filteredGestures.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400">
                        {t('gestures.empty', { defaultValue: 'No gestures found' })}
                      </td>
                    </tr>
                  ) : (
                    filteredGestures.map((gesture, i) => (
                      <tr 
                        key={`${gesture.pose_label}-${gesture.instance_id}`} 
                        className={`border-b border-table-border-dark hover:bg-table-row-hover transition-colors
                                    ${i % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}`}
                      >
                        <td className="px-6 py-4 text-gray-300 text-sm w-[10%]">
                          {String(gesture.instance_id).padStart(3, '0')}
                        </td>
                        <td className="px-6 py-4 font-medium text-white text-sm capitalize truncate w-[20%]">
                          {gesture.pose_label}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm w-[10%]">
                          {gesture.gesture_type === 'static'
                            ? t('gestures.typeStatic', { defaultValue: 'Static' })
                            : t('gestures.typeDynamic', { defaultValue: 'Dynamic' })}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm truncate w-[40%]" title={buildInstruction(gesture, t)}>
                          {buildInstruction(gesture, t)}
                        </td>
                        <td className="px-6 py-4 w-[20%]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMLPractice(gesture.pose_label)}
                              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
                                          bg-gradient-to-r from-blue-600 to-cyan-500 text-white
                                          hover:from-blue-500 hover:to-cyan-400`}
                            >
                              {t('gestures.practiceButton', { defaultValue: 'Practice' })}
                            </button>
                            <button
                              onClick={() => openInstructionModal(gesture)}
                              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
                                          bg-gray-600 text-white hover:bg-gray-500`}
                            >
                              {t('gestures.viewButton', { defaultValue: 'View' })}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 mt-6 flex-shrink-0">
        <p className="text-sm text-gray-400">
          {t('gestures.statAverageMotion', {
            defaultValue: 'Avg Δ (x, y): {{value}}',
            value: averageMotion,
          })}
        </p>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
            disabled={!canGoPrev}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors
                     ${canGoPrev
                       ? 'border-white/20 bg-black/50 text-gray-200 hover:border-cyan-400 hover:text-white'
                       : 'border-white/10 bg-black/20 text-gray-600 cursor-not-allowed'
                     }`}
          >
            {t('gestures.prev', { defaultValue: 'Previous' })}
          </button>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, prev.pages || 1) }))}
            disabled={!canGoNext}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors
                     ${canGoNext
                       ? 'border-white/20 bg-black/50 text-gray-200 hover:border-cyan-400 hover:text-white'
                       : 'border-white/10 bg-black/20 text-gray-600 cursor-not-allowed'
                     }`}
          >
            {t('gestures.next', { defaultValue: 'Next' })}
          </button>
        </div>
      </div>

      <InstructionModal
        open={Boolean(activeGesture)}
        gesture={activeGesture}
        instruction={activeGesture ? buildInstruction(activeGesture, t) : ''}
        onClose={closeInstructionModal}
        theme={theme}
        t={t}
      />

      {/* ML Practice Component */}
      {showMLPractice && selectedPracticeGesture && (
        <GesturePracticeML
          gestureName={selectedPracticeGesture}
          theme="dark"
          onClose={() => {
            setShowMLPractice(false);
            setSelectedPracticeGesture(null);
          }}
        />
      )}
    </motion.main>
  );
};

// Component con cho Stats (Style "kính mờ")
const StatCard = ({ label, value, className = 'text-white' }) => (
  <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 p-4 h-full flex flex-col justify-center">
    <span className="text-sm text-gray-400 block">{label}</span>
    <span className={`font-bold text-2xl ${className}`}>
      {value}
    </span>
  </div>
);

export default Gestures;