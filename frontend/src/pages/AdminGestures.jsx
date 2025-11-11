import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Loader2,
  Search as SearchIcon,
  X,
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminSidebar from '../components/AdminSidebar';
import CameraPreview from '../components/CameraPreview';
import GesturePracticeML from '../components/GesturePracticeML';
import GestureCustomization from '../components/GestureCustomization';
import Logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';
import { useTheme } from '../utils/ThemeContext';
import authService from '../services/authService';
import {
  fetchGestures,
  fetchGestureLabels,
  fetchGestureStats,
  getModelStatus,
  getModelInfo,
  testModel,
  submitCustomizationRequest,
} from '../services/gestureService';

const LIMIT = 20;
const STATIC_THRESHOLD = 0.02;
const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

const InstructionModal = ({ open, gesture, instruction, onClose, theme, t }) => {
  if (!open || !gesture) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div
        className={`relative w-full max-w-2xl rounded-2xl border ${
          theme === 'dark'
            ? 'bg-gray-900/95 border-gray-700 text-gray-100'
            : 'bg-white border-gray-200 text-gray-900'
        } shadow-2xl`}
      >
        <div
          className={`flex items-start justify-between px-6 py-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div>
            <p className="text-sm uppercase tracking-wide text-cyan-500 font-semibold">
              {gesture.gesture_type === 'static'
                ? t('gestures.modalStatic', { defaultValue: 'Static gesture' })
                : t('gestures.modalDynamic', { defaultValue: 'Dynamic gesture' })}
            </p>
            <h2 className="text-2xl font-semibold capitalize">
              {gesture.pose_label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-300'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            aria-label={t('gestures.modalClose', { defaultValue: 'Close' })}
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <section>
            <h3
              className={`text-sm font-semibold uppercase tracking-wide ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {t('gestures.modalInstruction', { defaultValue: 'Instruction' })}
            </h3>
            <p className="mt-2 leading-relaxed">{instruction}</p>
          </section>

          <section
            className={`rounded-xl border px-4 py-3 ${
              theme === 'dark'
                ? 'border-gray-700 bg-gray-800/60'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <h4
              className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {t('gestures.modalMeta', { defaultValue: 'Motion summary' })}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <p>
                <span className="font-medium">
                  {t('gestures.modalDelta', { defaultValue: '?x / ?y:' })}{' '}
                </span>
                {`${Number(gesture.delta_x || 0).toFixed(3)}, ${Number(
                  gesture.delta_y || 0
                ).toFixed(3)}`}
              </p>
              <p>
                <span className="font-medium">
                  {t('gestures.modalMainAxis', { defaultValue: 'Main axis:' })}{' '}
                </span>
                {`${gesture.main_axis_x}, ${gesture.main_axis_y}`}
              </p>
            </div>
          </section>
        </div>

        <div
          className={`flex justify-end px-6 py-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('gestures.modalClose', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>
  );
};
const describeMotion = (gesture, t) => {
  const dx = Number(gesture.delta_x) || 0;
  const dy = Number(gesture.delta_y) || 0;
  const magnitude = Math.sqrt(dx * dx + dy * dy);

  if (magnitude <= STATIC_THRESHOLD) {
    return t('gestures.instructionStatic', {
      defaultValue: 'Hold steady for about one second.',
    });
  }

  const isHorizontal = Math.abs(dx) >= Math.abs(dy);
  if (isHorizontal) {
    if (dx > 0) {
      return t('gestures.instructionMoveRight', {
        defaultValue: 'Sweep the hand to the right.',
      });
    }
    if (dx < 0) {
      return t('gestures.instructionMoveLeft', {
        defaultValue: 'Sweep the hand to the left.',
      });
    }
    return t('gestures.instructionHorizontal', {
      defaultValue: 'Perform a horizontal sweep.',
    });
  }

  if (dy > 0) {
    return t('gestures.instructionMoveDown', {
      defaultValue: 'Move the hand downward.',
    });
  }
  if (dy < 0) {
    return t('gestures.instructionMoveUp', {
      defaultValue: 'Move the hand upward.',
    });
  }
  return t('gestures.instructionVertical', {
    defaultValue: 'Perform a vertical sweep.',
  });
};

const buildInstruction = (gesture, t) => {
  const leftHand = t('gestures.instructionLeft', {
    defaultValue: 'Close left fist to start, release to finish.',
  });

  const fingerStates = FINGER_NAMES.map((name, index) => {
    const isOpen = Number(gesture[`right_finger_state_${index}`]) === 1;
    return `${name} ${
      isOpen
        ? t('gestures.fingerOpen', { defaultValue: 'open' })
        : t('gestures.fingerClosed', { defaultValue: 'closed' })
    }`;
  }).join(', ');

  const rightHand = t('gestures.instructionRight', {
    defaultValue: 'Right hand: {{states}}.',
    states: fingerStates,
  });

  const motion = describeMotion(gesture, t);

  return `${leftHand} ${rightHand} ${motion}`;
};

const AdminGestures = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [admin, setAdmin] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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

  // New state for custom gestures
  const [activeTab, setActiveTab] = useState('default');
  const [customizingGesture, setCustomizingGesture] = useState(null);
  const [customizedGestures, setCustomizedGestures] = useState([]);

  const handleCustomizationCompleted = useCallback((gestureName) => {
    setCustomizedGestures((prev) =>
      prev.includes(gestureName) ? prev : [...prev, gestureName]
    );
  }, []);

  const handleSubmitCustomizationRequest = useCallback(async () => {
    if (!customizedGestures.length) {
      toast.info('Bạn chưa thu thập gesture nào để gửi.');
      return;
    }
    try {
      await submitCustomizationRequest({
        adminId: admin?.id || admin?._id,
        gestures: customizedGestures,
      });
      toast.success('Đã gửi yêu cầu custom gesture.');
      setCustomizedGestures([]);
    } catch (error) {
      const msg = error.response?.data?.message || 'Gửi yêu cầu thất bại.';
      toast.error(msg);
    }
  }, [admin, customizedGestures]);

  useEffect(() => {
    const currentAdmin = authService.getCurrentUser();
    if (!currentAdmin) {
      navigate('/');
      return;
    }
    setAdmin(currentAdmin);
  }, [navigate]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [labelsResponse, statsResponse, modelStatusResponse, modelInfoResponse] = await Promise.all([
          fetchGestureLabels(),
          fetchGestureStats(),
          getModelStatus(),
          getModelInfo().catch(() => null), // Don't fail if model not found
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

  const handleLogout = () => {
    toast.info(t('notifications.logoutMessage'), {
      position: 'top-right',
      autoClose: 1500,
    });

    setTimeout(() => {
      authService.logout();
      navigate('/');
    }, 1000);
  };

  const handleChangeLabel = (event) => {
    setSelectedLabel(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleChangeType = (event) => {
    setSelectedType(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
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

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div
        className={`absolute inset-0 ${
          theme === 'dark' ? 'bg-gray-900/85' : 'bg-gray-50/85'
        }`}
      ></div>

      <div className="relative z-10 h-full flex flex-col">
        <header
          className={`sticky top-0 z-50 ${
            theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'
          } backdrop-blur-sm border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="px-6 py-4 flex items-center relative">
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img src={Logo} alt="GestPipe Logo" className="h-24" />
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-yellow-400 hover:text-yellow-300'
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                }`}
                title={
                  theme === 'dark'
                    ? t('common.switchLight', { defaultValue: 'Switch to Light Mode' })
                    : t('common.switchDark', { defaultValue: 'Switch to Dark Mode' })
                }
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button
                className={`p-2 rounded-lg transition-all relative ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                }`}
                title={t('common.notifications', { defaultValue: 'Notifications' })}
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    theme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        : 'bg-gradient-to-r from-blue-400 to-cyan-400'
                    } flex items-center justify-center text-white font-bold`}
                  >
                    {admin?.fullName?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <span
                    className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {admin?.fullName || 'Admin'}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {showUserDropdown && (
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    } py-2 z-50`}
                  >
                    <div
                      className={`px-4 py-3 border-b ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {admin?.fullName || 'Admin'}
                      </p>
                      <p
                        className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        } mt-1`}
                      >
                        {admin?.email || 'admin@gestpipe.com'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/profile')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-cyan-primary hover:bg-gray-700'
                          : 'text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {t('gestures.menuProfile', { defaultValue: 'Profile' })}
                    </button>
                    <button
                      onClick={() => navigate('/change-password')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {t('profile.changePassword')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-red-400 hover:bg-gray-700'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {t('gestures.menuLogout', { defaultValue: 'Logout' })}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar admin={admin} theme={theme} />

          <main className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative">
                  <select
                    value={selectedLabel}
                    onChange={handleChangeLabel}
                    className={`appearance-none pl-5 pr-12 py-3 font-semibold rounded-lg border transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-900/60 border-cyan-500/40 text-gray-100 hover:border-cyan-400 focus:border-cyan-300'
                        : 'bg-white border-gray-300 text-gray-800 hover:border-cyan-400 focus:border-cyan-500'
                    } focus:outline-none shadow-lg`}
                  >
                    <option value="all">
                      {t('gestures.filterAll', { defaultValue: 'All gestures' })}
                    </option>
                    {labels.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${
                      theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'
                    }`}
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={handleChangeType}
                    className={`appearance-none pl-5 pr-12 py-3 font-semibold rounded-lg border transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-900/60 border-slate-500/50 text-gray-100 hover:border-slate-300 focus:border-slate-200'
                        : 'bg-white border-gray-300 text-gray-800 hover:border-slate-400 focus:border-slate-500'
                    } focus:outline-none shadow-lg`}
                  >
                    <option value="all">
                      {t('gestures.filterTypeAll', { defaultValue: 'All types' })}
                    </option>
                    <option value="static">
                      {t('gestures.filterTypeStatic', { defaultValue: 'Static only' })}
                    </option>
                    <option value="dynamic">
                      {t('gestures.filterTypeDynamic', { defaultValue: 'Dynamic only' })}
                    </option>
                  </select>
                  <ChevronDown
                    size={18}
                    className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  />
                </div>
              </div>

              <div
                className={`relative flex items-center w-full max-w-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border border-gray-600'
                    : 'bg-white border border-gray-300 shadow'
                } rounded-lg`}
              >
                <SearchIcon
                  className={`absolute left-3 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                  size={20}
                />
                <input
                  type="text"
                  placeholder={t('gestures.searchPlaceholder', {
                    defaultValue: 'Search gesture...',
                  })}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className={`pl-10 pr-4 py-3 w-full bg-transparent focus:outline-none text-sm ${
                    theme === 'dark'
                      ? 'text-white placeholder-gray-400'
                      : 'text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Tabs for Default and Custom Gestures */}
            <div className="mb-6 border-b border-gray-700">
              <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                <li className="mr-2">
                  <button
                    onClick={() => setActiveTab('default')}
                    className={`inline-block p-4 rounded-t-lg transition-colors ${
                      activeTab === 'default'
                        ? 'border-b-2 text-cyan-400 border-cyan-400 font-semibold'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    }`}
                  >
                    Default Gestures
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    onClick={() => setActiveTab('custom')}
                    className={`inline-block p-4 rounded-t-lg transition-colors ${
                      activeTab === 'custom'
                        ? 'border-b-2 text-cyan-400 border-cyan-400 font-semibold'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    }`}
                  >
                    Custom Gestures
                  </button>
                </li>
              </ul>
            </div>

            {activeTab === 'default' && (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                  <CameraPreview theme={theme} />
                </div>

                {error && (
                  <div
                    className={`mb-4 p-4 border rounded-lg ${
                      theme === 'dark'
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2
                      size={48}
                      className={`${
                        theme === 'dark' ? 'text-cyan-500' : 'text-blue-500'
                      } animate-spin`}
                    />
                    <p
                      className={`text-lg font-medium ${
                        theme === 'dark' ? 'text-cyan-500' : 'text-blue-500'
                      }`}
                    >
                      {t('gestures.loading', {
                        defaultValue: 'Loading gestures...',
                      })}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`border rounded-xl overflow-hidden backdrop-blur-sm ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
                        : 'bg-white/50 border-gray-200/50'
                    }`}
                  >
                    <div className="max-h-[calc(100vh-360px)] overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 z-10">
                          <tr
                            className={`border-b ${
                              theme === 'dark'
                                ? 'bg-gray-700/50 border-gray-600'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <th
                              className={`px-6 py-4 text-left text-sm font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {t('gestures.columnId', { defaultValue: 'ID' })}
                            </th>
                            <th
                              className={`px-6 py-4 text-left text-sm font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {t('gestures.poseLabel', {
                                defaultValue: 'Pose Label',
                              })}
                            </th>
                            <th
                              className={`px-6 py-4 text-left text-sm font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {t('gestures.columnType', { defaultValue: 'Type' })}
                            </th>
                            <th
                              className={`px-6 py-4 text-left text-sm font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {t('gestures.columnInstruction', {
                                defaultValue: 'Instruction',
                              })}
                            </th>
                            <th
                              className={`px-6 py-4 text-center text-sm font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {t('gestures.columnActions', {
                                defaultValue: 'Training',
                              })}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGestures.length === 0 ? (
                            <tr>
                              <td
                                colSpan="5"
                                className={`px-6 py-12 text-center ${
                                  theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                                }`}
                              >
                                {t('gestures.empty', {
                                  defaultValue: 'No gestures found',
                                })}
                              </td>
                            </tr>
                          ) : (
                            filteredGestures.map((gesture) => (
                              <tr
                                key={`${gesture.pose_label}-${gesture.instance_id}`}
                                className={`border-b transition-colors ${
                                  theme === 'dark'
                                    ? 'border-gray-700/50 hover:bg-gray-800/30'
                                    : 'border-gray-100 hover:bg-gray-50'
                                }`}
                              >
                                <td
                                  className={`px-6 py-4 ${
                                    theme === 'dark'
                                      ? 'text-gray-300'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {String(gesture.instance_id).padStart(3, '0')}
                                </td>
                                <td
                                  className={`px-6 py-4 font-medium capitalize ${
                                    theme === 'dark'
                                      ? 'text-white'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {gesture.pose_label}
                                </td>
                                <td
                                  className={`px-6 py-4 ${
                                    theme === 'dark'
                                      ? 'text-gray-300'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {gesture.gesture_type === 'static'
                                    ? t('gestures.typeStatic', { defaultValue: 'Static' })
                                    : t('gestures.typeDynamic', { defaultValue: 'Dynamic' })}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleMLPractice(gesture.pose_label)}
                                      className={`px-4 py-2 rounded font-medium transition-all ${
                                        theme === 'dark'
                                          ? 'bg-blue-800 text-blue-300 hover:bg-blue-700'
                                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                      }`}
                                    >
                                      🎯 Practice Gesture
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => openInstructionModal(gesture)}
                                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                      theme === 'dark'
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-cyan-500/40'
                                        : 'bg-gradient-to-r from-cyan-400 to-blue-400 text-white hover:shadow-cyan-400/40'
                                    }`}
                                  >
                                    {t('gestures.trainButton', {
                                      defaultValue: 'View instruction',
                                    })}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'custom' && (
              <div
                className={`border rounded-xl overflow-hidden backdrop-blur-sm ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
                    : 'bg-white/50 border-gray-200/50'
                }`}
              >
                <div className="p-4 text-gray-300">
                  <h3 className="text-lg font-semibold text-white mb-2">Customize Your Gestures</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Here you can provide your own samples for existing gestures. Click 'Customize' to open the recording window.
                    <br />
                    Once you have collected all your custom samples, click 'Request Customization' to submit them for approval.
                  </p>
                </div>
                <div className="max-h-[calc(100vh-420px)] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr
                        className={`border-b ${
                          theme === 'dark'
                            ? 'bg-gray-700/50 border-gray-600'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <th
                          className={`px-6 py-4 text-left text-sm font-semibold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          Gesture Name
                        </th>
                        <th
                          className={`px-6 py-4 text-center text-sm font-semibold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {labels.length === 0 ? (
                        <tr>
                          <td
                            colSpan="2"
                            className={`px-6 py-12 text-center ${
                              theme === 'dark'
                                ? 'text-gray-400'
                                : 'text-gray-500'
                            }`}
                          >
                            Loading gesture list...
                          </td>
                        </tr>
                      ) : (
                        labels.map((label) => (
                          <tr
                            key={label}
                            className={`border-b transition-colors ${
                              theme === 'dark'
                                ? 'border-gray-700/50 hover:bg-gray-800/30'
                                : 'border-gray-100 hover:bg-gray-50'
                            }`}
                          >
                            <td
                              className={`px-6 py-4 font-medium capitalize ${
                                theme === 'dark'
                                  ? 'text-white'
                                  : 'text-gray-900'
                              }`}
                            >
                              {label.replace(/_/g, ' ')}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => setCustomizingGesture(label)}
                                disabled={customizedGestures.includes(label)}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  customizedGestures.includes(label)
                                    ? 'bg-gray-500 text-gray-200 cursor-not-allowed'
                                    : theme === 'dark'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-cyan-500/40'
                                    : 'bg-gradient-to-r from-cyan-400 to-blue-400 text-white hover:shadow-cyan-400/40'
                                }`}
                              >
                                {customizedGestures.includes(label) ? 'Recorded' : '✨ Customize'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
                    <button
                        onClick={handleSubmitCustomizationRequest}
                        className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all disabled:bg-gray-500"
                        disabled={customizedGestures.length === 0}
                    >
                        Request Customization {customizedGestures.length > 0 ? `(${customizedGestures.length})` : ''}
                    </button>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div
                className={`border rounded-lg px-6 py-3 ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                <span
                  className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {t('gestures.statTotal', { defaultValue: 'Total samples:' })}{' '}
                </span>
                <span
                  className={`font-bold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {totalGestures}
                </span>
              </div>
              <div
                className={`border rounded-lg px-6 py-3 ${
                  theme === 'dark'
                    ? 'bg-cyan-500/20 border-cyan-500/50'
                    : 'bg-cyan-50 border-cyan-200'
                }`}
              >
                <span
                  className={`text-sm ${
                    theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'
                  }`}
                >
                  {t('gestures.statUnique', { defaultValue: 'Unique poses:' })}{' '}
                </span>
                <span
                  className={`font-bold text-lg ${
                    theme === 'dark' ? 'text-cyan-300' : 'text-cyan-700'
                  }`}
                >
                  {uniquePoses}
                </span>
              </div>
              <div
                className={`border rounded-lg px-6 py-3 ${
                  theme === 'dark'
                    ? 'bg-emerald-500/20 border-emerald-500/40'
                    : 'bg-emerald-50 border-emerald-200'
                }`}
              >
                <span
                  className={`text-sm ${
                    theme === 'dark' ? 'text-emerald-300' : 'text-emerald-600'
                  }`}
                >
                  {t('gestures.statStatic', { defaultValue: 'Static samples:' })}{' '}
                </span>
                <span
                  className={`font-bold text-lg ${
                    theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'
                  }`}
                >
                  {staticCount}
                </span>
              </div>
              <div
                className={`border rounded-lg px-6 py-3 ${
                  theme === 'dark'
                    ? 'bg-violet-500/20 border-violet-500/40'
                    : 'bg-violet-50 border-violet-200'
                }`}
              >
                <span
                  className={`text-sm ${
                    theme === 'dark' ? 'text-violet-300' : 'text-violet-600'
                  }`}
                >
                  {t('gestures.statDynamic', {
                    defaultValue: 'Dynamic samples:',
                  })}{' '}
                </span>
                <span
                  className={`font-bold text-lg ${
                    theme === 'dark' ? 'text-violet-300' : 'text-violet-700'
                  }`}
                >
                  {dynamicCount}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
              <p
                className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {t('gestures.statAverageMotion', {
                  defaultValue: 'Avg ? (x, y): {{value}}',
                  value: averageMotion,
                })}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(prev.page - 1, 1),
                    }))
                  }
                  disabled={!canGoPrev}
                  className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                    canGoPrev
                      ? 'border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {t('gestures.prev', { defaultValue: 'Previous' })}
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.page + 1, prev.pages || 1),
                    }))
                  }
                  disabled={!canGoNext}
                  className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                    canGoNext
                      ? 'border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {t('gestures.next', { defaultValue: 'Next' })}
                </button>
              </div>
            </div>
          </main>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="dark"
          style={{ zIndex: 9999 }}
        />
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

      {/* Gesture Customization Component */}
      {customizingGesture && (
        <GestureCustomization
          gestureName={customizingGesture}
          admin={admin}
          theme={theme}
          onCompleted={handleCustomizationCompleted}
          onClose={() => setCustomizingGesture(null)}
        />
      )}
    </div>
  );
};

export default AdminGestures;


