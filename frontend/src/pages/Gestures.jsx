import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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

import RoleBasedSidebar from '../components/RoleBasedSidebar';
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
  getGestureStatuses,
  submitGestureForApproval,
  deleteAllCustomedGestures,
  approveGestureRequests,
  // Practice session functions removed
  getAllRequests,
  approveRequest,
  rejectRequest,
  submitForApproval,
  fetchCustomizationRequests,
  approveCustomizationRequest,
  rejectCustomizationRequest,
  getAdminGestureSamples,
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

const Gestures = ({ showCustomTab = false }) => {
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
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'custom' | 'request' | 'myrequests'
  const [customizingGesture, setCustomizingGesture] = useState(null);
  const [gestureStatuses, setGestureStatuses] = useState([]);
  const [gestureStatusesLoading, setGestureStatusesLoading] = useState(false);

  // Request management states
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(false);

  // Instruction modal functions
  const openInstructionModal = (gesture) => {
    setActiveGesture(gesture);
  };

  const closeInstructionModal = () => {
    setActiveGesture(null);
  };

  // Reject modal functions
  const openRejectModal = (requestId) => {
    setRejectRequestId(requestId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectRequestId(null);
    setRejectReason('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a reject reason');
      return;
    }

    try {
      await handleRejectRequest(rejectRequestId, rejectReason.trim());
      closeRejectModal();
    } catch (error) {
      // Error already handled in handleRejectRequest
    }
  };

  const getGestureStatus = (poseLabel) => {
    const gesture = gestureStatuses.find(g => g.gestureId === poseLabel);
    return gesture ? gesture.status : 'ready';
  };

  useEffect(() => {
    const currentAdmin = authService.getCurrentUser();
    if (!currentAdmin) {
      navigate('/');
      return;
    }
    setAdmin(currentAdmin);
  }, [navigate]);

  // Load gesture statuses when admin changes
  useEffect(() => {
    const loadGestureStatuses = async () => {
      if (!admin) return;

      try {
        setGestureStatusesLoading(true);
        const response = await getGestureStatuses();
        setGestureStatuses(response.data.requests || []);
      } catch (error) {
        console.warn('Failed to load gesture statuses:', error);
        setGestureStatuses([]);
      } finally {
        setGestureStatusesLoading(false);
      }
    };

    loadGestureStatuses();
  }, [admin]);

  // Load pending requests for superadmin
  useEffect(() => {
    const loadPendingRequests = async () => {
      if (!admin || admin.role !== 'superadmin') return;

      try {
        setRequestsLoading(true);
        const response = await fetchCustomizationRequests('pending');
        setRequests(response || []);
      } catch (error) {
        console.warn('Failed to load pending requests:', error);
        setRequests([]);
      } finally {
        setRequestsLoading(false);
      }
    };

    loadPendingRequests();
  }, [admin]);

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

  const loadRequests = useCallback(async () => {
    if (admin?.role !== 'superadmin') return;

    try {
      setRequestsLoading(true);
      const response = await fetchCustomizationRequests('pending');
      setRequests(response || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
      toast.error('Failed to load requests');
    } finally {
      setRequestsLoading(false);
    }
  }, [admin?.role]);

  const loadMyRequests = useCallback(async () => {
    if (!admin?._id) return;

    try {
      setMyRequestsLoading(true);
      const response = await getAllRequests();
      // Filter requests by current admin
      const myFilteredRequests = response.data?.filter(request => 
        request.adminId?._id === admin._id
      ) || [];
      setMyRequests(myFilteredRequests);
    } catch (err) {
      console.error('Failed to load my requests:', err);
      toast.error('Failed to load my requests');
    } finally {
      setMyRequestsLoading(false);
    }
  }, [admin?._id]);

  // Load requests when tab changes to request or requests
  useEffect(() => {
    if ((activeTab === 'request' || activeTab === 'requests') && admin?.role === 'superadmin') {
      loadRequests();
    } else if (activeTab === 'myrequests' && admin?.role === 'admin') {
      loadMyRequests();
    }
  }, [activeTab, admin?.role, loadRequests, loadMyRequests]);

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

  // Removed training-related functions
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

  const handleSubmitForApproval = async () => {
    if (!admin) {
      toast.error('Missing administrator information.');
      return;
    }

    try {
      // Get gestures that are customized but not yet submitted
      const customizedGestures = gestureStatuses
        .filter(r => r.status === 'customed')
        .map(r => r.gestureId);

      console.log('[handleSubmitForApproval] admin:', admin);
      console.log('[handleSubmitForApproval] gestureStatuses:', gestureStatuses);
      console.log('[handleSubmitForApproval] customizedGestures:', customizedGestures);

      // If no customized gestures, try to submit all available gestures
      let gesturesToSubmit = customizedGestures;
      if (gesturesToSubmit.length === 0) {
        gesturesToSubmit = gestureStatuses
          .filter(r => r.status !== 'blocked')
          .map(r => r.gestureId);
        console.log('[handleSubmitForApproval] Using all available gestures:', gesturesToSubmit);
      }

      if (gesturesToSubmit.length === 0) {
        toast.info('No gestures available to submit for approval.');
        return;
      }

      console.log('[handleSubmitForApproval] admin._id:', admin._id);
      console.log('[handleSubmitForApproval] admin.id:', admin.id);

      const resp = await submitForApproval(admin._id || admin.id, gesturesToSubmit);
      toast.success(resp.message || 'Gestures submitted for approval successfully.');

      // Refresh statuses
      const response = await getGestureStatuses();
      setGestureStatuses(response.data.requests || []);
    } catch (err) {
      console.error('[handleSubmitForApproval] Error:', err);
      toast.error(err?.response?.data?.message || 'Failed to submit for approval.');
    }
  };

  const handleDeleteAllCustomed = async () => {
    if (!admin) {
      toast.error('Missing administrator information.');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete all customed gestures and their data? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const resp = await deleteAllCustomedGestures();
      toast.success(resp.message || 'All customed gestures deleted.');
      
      // Refresh statuses
      const response = await getGestureStatuses();
      setGestureStatuses(response.data.requests || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete gestures.');
    }
  };

  const handleChangeLabel = (event) => {
    setSelectedLabel(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleChangeType = (event) => {
    setSelectedType(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Removed training and Python practice functions

  // ML Practice function
  const handleMLPractice = (gestureLabel) => {
    setSelectedPracticeGesture(gestureLabel);
    setShowMLPractice(true);
  };

  // Request management functions
  const handleApproveRequest = async (requestId, adminId) => {
    try {
      setProcessingRequest(requestId);
      await approveRequest(requestId, adminId);
      toast.success('Request approved successfully');
      loadRequests(); // Reload requests
    } catch (err) {
      console.error('Failed to approve request:', err);
      toast.error(err?.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId, rejectReason) => {
    try {
      setProcessingRequest(requestId);
      await rejectRequest(requestId, rejectReason);
      toast.success('Request rejected successfully');
      loadRequests(); // Reload requests
    } catch (err) {
      console.error('Failed to reject request:', err);
      toast.error(err?.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingRequest(null);
    }
  };

  // Customization request management functions
  const handleApproveCustomizationRequest = async (requestId, adminId) => {
    try {
      setProcessingRequest(requestId);
      await approveCustomizationRequest(requestId);
      toast.success('Customization request approved successfully');

      // Load AdminGestureSamples to verify data was saved
      try {
        const samplesResponse = await getAdminGestureSamples(adminId);
        console.log('AdminGestureSamples loaded:', samplesResponse);
        if (samplesResponse.success && samplesResponse.count > 0) {
          toast.success(`Saved ${samplesResponse.count} gesture samples to database`);
        }
      } catch (samplesError) {
        console.warn('Could not load AdminGestureSamples:', samplesError);
      }

      loadRequests(); // Reload requests
    } catch (err) {
      console.error('Failed to approve customization request:', err);
      toast.error(err?.response?.data?.message || 'Failed to approve customization request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectCustomizationRequest = async (requestId) => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a reject reason');
      return;
    }

    try {
      setProcessingRequest(requestId);
      await rejectCustomizationRequest(requestId, rejectReason.trim());
      toast.success('Customization request rejected successfully');
      setRejectRequestId(null);
      setRejectReason('');
      loadRequests(); // Reload requests
    } catch (err) {
      console.error('Failed to reject customization request:', err);
      toast.error(err?.response?.data?.message || 'Failed to reject customization request');
    } finally {
      setProcessingRequest(null);
    }
  };

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
                          : 'text-cyan-600 hover:bg-gray-100'
                      }`}
                    >
                      {t('gestures.menuProfile', { defaultValue: 'Profile' })}
                    </button>
                    {admin?.role === 'superadmin' && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetchCustomizationRequests('pending');
                            setRequests(response || []);
                          } catch (error) {
                            console.error('Failed to load requests:', error);
                            toast.error('Failed to load pending requests');
                          }
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          theme === 'dark'
                            ? 'text-orange-400 hover:bg-gray-700'
                            : 'text-orange-600 hover:bg-gray-100'
                        }`}
                      >
                        View Pending Requests ({requests.length})
                      </button>
                    )}
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
    <RoleBasedSidebar admin={admin} theme={theme} />

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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <CameraPreview theme={theme} />

              {/* Removed Gesture Status Overview - now integrated in table */}
            </div>

            {/* Admin-only tabs: All / Custom / Request (superadmin only) / Requests (superadmin inline) */}
            {(showCustomTab || admin?.role === 'superadmin') && (
              <div className="mb-4">
                <div className="inline-flex rounded-lg overflow-hidden border" role="tablist">
                  <button
                    role="tab"
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 font-semibold ${activeTab === 'all' ? 'bg-cyan-500 text-white' : 'bg-white text-gray-700'}`}
                  >
                    {t('gestures.tabAll', { defaultValue: 'All' })}
                  </button>
                  {showCustomTab && (
                    <button
                      role="tab"
                      onClick={() => setActiveTab('custom')}
                      className={`px-4 py-2 font-semibold ${activeTab === 'custom' ? 'bg-cyan-500 text-white' : 'bg-white text-gray-700'}`}
                    >
                      {t('gestures.tabCustom', { defaultValue: 'Custom' })}
                    </button>
                  )}
                  {admin?.role === 'admin' && showCustomTab && (
                    <button
                      role="tab"
                      onClick={() => setActiveTab('myrequests')}
                      className={`px-4 py-2 font-semibold ${activeTab === 'myrequests' ? 'bg-cyan-500 text-white' : 'bg-white text-gray-700'}`}
                    >
                      My Requests
                    </button>
                  )}
                  {admin?.role === 'superadmin' && showCustomTab && (
                    <button
                      role="tab"
                      onClick={() => setActiveTab('request')}
                      className={`px-4 py-2 font-semibold ${activeTab === 'request' ? 'bg-cyan-500 text-white' : 'bg-white text-gray-700'}`}
                    >
                      {t('gestures.tabRequest', { defaultValue: 'Request' })}
                    </button>
                  )}
                  {admin?.role === 'superadmin' && (
                    <button
                      role="tab"
                      onClick={() => setActiveTab('requests')}
                      className={`px-4 py-2 font-semibold ${activeTab === 'requests' ? 'bg-cyan-500 text-white' : 'bg-white text-gray-700'}`}
                    >
                      Pending Requests
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Gesture List */}
            {/* Simplified gesture interface without training */}

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

            {/* If admin selected Custom tab, we still show the gesture list but switch row actions. */}
            {activeTab === 'myrequests' ? (
              // My Requests Tab
              <div className={`border-2 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/70 border-gray-600/70'
                  : 'bg-white/80 border-gray-300/70'
              }`}>
                <div className="p-6">
                  <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    My Gesture Requests
                  </h3>

                  {myRequestsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 size={32} className="animate-spin text-cyan-500" />
                      <span className="ml-2">Loading my requests...</span>
                    </div>
                  ) : myRequests.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      No requests submitted yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myRequests.map((request) => (
                        <div key={request._id} className={`p-4 rounded-lg border ${
                          theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-300'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Request #{request._id.slice(-6)}
                              </h4>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                Submitted on {new Date(request.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                              request.status === 'accept' ? 'bg-green-500/20 text-green-700' :
                              'bg-red-500/20 text-red-700'
                            }`}>
                              {request.status}
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              Requested Gestures:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {request.gestures?.map((gesture, index) => (
                                <span key={index} className={`px-2 py-1 rounded text-xs ${
                                  theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {gesture}
                                </span>
                              ))}
                            </div>
                          </div>

                          {request.rejectReason && (
                            <div className="mb-3">
                              <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Reject Reason:
                              </p>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {request.rejectReason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'request' ? (
              // Request Management Tab
              <div className={`border-2 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/70 border-gray-600/70'
                  : 'bg-white/80 border-gray-300/70'
              }`}>
                <div className="p-6">
                  <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Gesture Approval Requests
                  </h3>

                  {requestsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 size={32} className="animate-spin text-cyan-500" />
                      <span className="ml-2">Loading requests...</span>
                    </div>
                  ) : requests.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      No pending requests
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requests.map((request) => (
                        <div key={request._id} className={`p-4 rounded-lg border ${
                          theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-300'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {request.adminId?.fullName || 'Unknown Admin'}
                              </h4>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {request.adminId?.email}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                              request.status === 'accept' ? 'bg-green-500/20 text-green-700' :
                              'bg-red-500/20 text-red-700'
                            }`}>
                              {request.status}
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              Requested Gestures:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {request.gestures?.map((gesture, index) => (
                                <span key={index} className={`px-2 py-1 rounded text-xs ${
                                  theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {gesture}
                                </span>
                              ))}
                            </div>
                          </div>

                          {request.rejectReason && (
                            <div className="mb-3">
                              <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Reject Reason:
                              </p>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {request.rejectReason}
                              </p>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(request.createdAt).toLocaleString()}
                            </p>

                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveRequest(request._id, request.adminId._id)}
                                  disabled={processingRequest === request._id}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                >
                                  {processingRequest === request._id ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => openRejectModal(request._id)}
                                  disabled={processingRequest === request._id}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                                >
                                  {processingRequest === request._id ? 'Processing...' : 'Reject'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'requests' ? (
              // Pending Requests Tab (inline style)
              <div className={`border-2 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/70 border-gray-600/70'
                  : 'bg-white/80 border-gray-300/70'
              }`}>
                <div className="p-6">
                  <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Pending Gesture Requests
                  </h3>

                  {requestsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 size={32} className="animate-spin text-cyan-500" />
                      <span className="ml-2">Loading requests...</span>
                    </div>
                  ) : requests.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      No pending requests
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requests.map((request) => (
                        <div
                          key={request._id}
                          className={`p-4 rounded-lg border ${
                            theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {request.gestures?.join(', ') || 'No gestures specified'}
                              </h4>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                                Requested by: {request.adminId?.email || 'Unknown'}
                              </p>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                Created: {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handleApproveCustomizationRequest(request._id, request.adminId)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectRequestId(request._id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                          {rejectRequestId === request._id && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                              <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                                  theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                                }`}
                                rows={3}
                              />
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={() => handleRejectCustomizationRequest(request._id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                  Confirm Reject
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectRequestId(null);
                                    setRejectReason('');
                                  }}
                                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : loading ? (
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
                className={`border-2 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/70 border-gray-600/70'
                    : 'bg-white/80 border-gray-300/70'
                }`}
              >
                <div className="max-h-[calc(100vh-360px)] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr
                        className={`border-b-2 ${
                          theme === 'dark'
                            ? 'bg-gray-700/80 border-gray-500'
                            : 'bg-gray-100/90 border-gray-300'
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
                          {activeTab === 'custom'
                            ? t('gestures.columnStatus', { defaultValue: 'Status' })
                            : t('gestures.columnInstruction', { defaultValue: 'Instruction' })
                          }
                        </th>
                        <th
                          className={`px-6 py-4 text-center text-sm font-semibold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {activeTab === 'custom'
                            ? t('gestures.columnCustom', { defaultValue: 'Custom' })
                            : t('gestures.columnActions', { defaultValue: 'Training' })
                          }
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
                            {/** Replace Practice/Instruction with Status/Custom in Custom tab */}
                            {showCustomTab && activeTab === 'custom' ? (
                              <>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      getGestureStatus(gesture.pose_label) === 'ready'
                                        ? theme === 'dark'
                                          ? 'bg-green-900/30 text-green-300 border border-green-600'
                                          : 'bg-green-50 text-green-700 border border-green-300'
                                        : getGestureStatus(gesture.pose_label) === 'customed'
                                        ? theme === 'dark'
                                          ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-600'
                                          : 'bg-yellow-50 text-yellow-700 border border-yellow-300'
                                        : getGestureStatus(gesture.pose_label) === 'blocked'
                                        ? theme === 'dark'
                                          ? 'bg-red-900/30 text-red-300 border border-red-600'
                                          : 'bg-red-50 text-red-700 border border-red-300'
                                        : theme === 'dark'
                                        ? 'bg-gray-900/30 text-gray-300 border border-gray-600'
                                        : 'bg-gray-50 text-gray-700 border border-gray-300'
                                    }`}
                                  >
                                    {getGestureStatus(gesture.pose_label) || 'ready'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => setCustomizingGesture(gesture)}
                                    disabled={getGestureStatus(gesture.pose_label) === 'customed' || getGestureStatus(gesture.pose_label) === 'blocked'}
                                    className={`px-4 py-2 rounded font-medium transition-all ${
                                      getGestureStatus(gesture.pose_label) === 'customed'
                                        ? theme === 'dark'
                                          ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-600 cursor-not-allowed'
                                          : 'bg-yellow-100 text-yellow-800 border border-yellow-400 cursor-not-allowed'
                                        : getGestureStatus(gesture.pose_label) === 'blocked'
                                        ? theme === 'dark'
                                          ? 'bg-red-900/50 text-red-300 border border-red-600 cursor-not-allowed'
                                          : 'bg-red-100 text-red-800 border border-red-400 cursor-not-allowed'
                                        : theme === 'dark'
                                        ? 'bg-green-600 text-white hover:bg-green-500'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  >
                                    {getGestureStatus(gesture.pose_label) === 'customed'
                                      ? t('gestures.customizedButton', { defaultValue: 'Customized' })
                                      : getGestureStatus(gesture.pose_label) === 'blocked'
                                      ? t('gestures.submittedButton', { defaultValue: 'Submitted' })
                                      : t('gestures.customizeButton', { defaultValue: 'Customize' })
                                    }
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
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
                                      ?? Practice Gesture
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
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Action buttons for Custom tab */}
                {showCustomTab && activeTab === 'custom' && (
                  <div className="mt-4 flex gap-2 justify-center">
                    {gestureStatuses.some(r => r.status !== 'blocked') && (
                      <button
                        onClick={handleSubmitForApproval}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        Submit for Approval
                      </button>
                    )}
                    {admin?.role === 'superadmin' && gestureStatuses.some(r => r.status !== 'blocked') && (
                      <button
                        onClick={handleDeleteAllCustomed}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        Delete All Customed
                      </button>
                    )}
                  </div>
                )}
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

      {/* Removed training confirmation modal */}





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

      {/* Admin customization modal (per-gesture) */}
      {customizingGesture && (
        <GestureCustomization
          gestureName={customizingGesture.pose_label || customizingGesture}
          admin={admin}
          onClose={() => setCustomizingGesture(null)}
          onCompleted={async (gestureName) => {
            setCustomizingGesture(null);
            // Reload gesture statuses to reflect the updated status after customization
            try {
              const response = await getGestureStatuses();
              setGestureStatuses(response.data.requests || []);
            } catch (error) {
              console.error('Failed to reload gesture statuses:', error);
            }
          }}
          theme={theme}
        />
      )}

      {/* Superadmin Pending Requests Section */}
      {admin?.role === 'superadmin' && requests.length > 0 && activeTab !== 'requests' && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Pending Gesture Requests
          </h3>
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {request.gestures?.join(', ') || 'No gestures specified'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Requested by: {request.adminId?.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Created: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApproveCustomizationRequest(request._id, request.adminId)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectRequestId(request._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                {rejectRequestId === request._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      rows={3}
                    />
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleRejectCustomizationRequest(request._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => {
                          setRejectRequestId(null);
                          setRejectReason('');
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gestures;

