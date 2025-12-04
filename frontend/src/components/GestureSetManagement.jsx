import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../utils/ThemeContext';
import { Download, Upload, RefreshCw, CheckCircle, AlertCircle, Clock, Package } from 'lucide-react';

const GestureSetManagement = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [availableGestureSets, setAvailableGestureSets] = useState([]);
  const [currentActiveSet, setCurrentActiveSet] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [publishDescription, setPublishDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadGestureSets();
  }, []);

  const loadGestureSets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      console.log('[DEBUG] Token exists:', !!token);
      console.log('[DEBUG] Making request to /api/gesture-sets/available');
      
      const response = await fetch('/api/gesture-sets/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[DEBUG] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[DEBUG] Error response:', errorData);
        throw new Error(errorData.message || 'Failed to load gesture sets');
      }

      const data = await response.json();
      
      if (data.success) {
        setAvailableGestureSets(data.data.availableGestureSets || []);
        setCurrentActiveSet(data.data.currentActiveSet);
      } else {
        throw new Error(data.message || 'Failed to load gesture sets');
      }
      
    } catch (error) {
      console.error('Error loading gesture sets:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishGestureSet = async () => {
    if (!selectedSetId) {
      setError('Please select a gesture set to publish');
      return;
    }

    const selectedSet = availableGestureSets.find(set => set.id === selectedSetId);
    if (!selectedSet) {
      setError('Selected gesture set not found');
      return;
    }

    try {
      setPublishing(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/gesture-sets/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          gestureSetId: selectedSet.id,
          gestureSetName: selectedSet.name,
          description: publishDescription || `Published gesture set: ${selectedSet.name}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to publish gesture set');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        setSelectedSetId('');
        setPublishDescription('');
        // Reload data to reflect changes
        await loadGestureSets();
      } else {
        throw new Error(data.message || 'Failed to publish gesture set');
      }
      
    } catch (error) {
      console.error('Error publishing gesture set:', error);
      setError(error.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            {t('gestureSetManagement.title', 'Gesture Set Management')}
          </h1>
          <button
            onClick={loadGestureSets}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              theme === 'dark' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Current Active Set */}
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            {t('gestureSetManagement.currentActiveSet', 'Current Active Gesture Set')}
          </h2>
          
          {currentActiveSet ? (
            <div className={`p-3 rounded border ${
              theme === 'dark' 
                ? 'bg-green-900/20 border-green-700' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-green-600">{currentActiveSet.name}</h3>
                  <p className="text-sm text-gray-500">
                    {t('gestureSetManagement.version', 'Version')}: {currentActiveSet.version}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{t('gestureSetManagement.publishedAt', 'Published')}: {new Date(currentActiveSet.publishedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">
              {t('gestureSetManagement.noActiveSet', 'No active gesture set found')}
            </p>
          )}
        </div>

        {/* Available Gesture Sets */}
        <div className={`rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {t('gestureSetManagement.availableGestureSets', 'Available Gesture Sets')}
            </h2>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">{t('common.loading', 'Loading')}...</p>
              </div>
            ) : availableGestureSets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('gestureSetManagement.noGestureSets', 'No gesture sets found in Drive')}</p>
                <p className="text-sm">{t('gestureSetManagement.uploadGestureSets', 'Upload gesture sets to the GestureSets folder first')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableGestureSets.map((gestureSet) => (
                  <div
                    key={gestureSet.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedSetId === gestureSet.id
                        ? theme === 'dark' 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-blue-500 bg-blue-50'
                        : theme === 'dark'
                          ? 'border-gray-600 hover:border-gray-500'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSetId(gestureSet.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{gestureSet.name}</h3>
                        <p className="text-sm text-gray-500">
                          {t('gestureSetManagement.lastModified', 'Modified')}: {new Date(gestureSet.modified_time).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {selectedSetId === gestureSet.id && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Publish Section */}
        {selectedSetId && (
          <div className={`mt-6 p-4 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-3">
              {t('gestureSetManagement.publishGestureSet', 'Publish Gesture Set')}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {t('gestureSetManagement.description', 'Description')} ({t('common.optional', 'Optional')})
              </label>
              <textarea
                value={publishDescription}
                onChange={(e) => setPublishDescription(e.target.value)}
                placeholder={t('gestureSetManagement.descriptionPlaceholder', 'Enter description for this version...')}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                rows={3}
              />
            </div>

            <button
              onClick={handlePublishGestureSet}
              disabled={publishing || !selectedSetId}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              {publishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('gestureSetManagement.publishing', 'Publishing')}...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {t('gestureSetManagement.publishButton', 'Publish Selected Set')}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestureSetManagement;