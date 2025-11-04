import axios from 'axios';

const API_URL = 'http://localhost:5000/api/gestures';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

export const fetchGestures = async ({ page = 1, limit = 25, poseLabel, gestureType } = {}) => {
  const params = { page, limit };
  if (poseLabel) {
    params.poseLabel = poseLabel;
  }
  if (gestureType && gestureType !== 'all') {
    params.gestureType = gestureType;
  }
  const response = await axios.get(API_URL, {
    params,
    headers: authHeaders(),
  });
  return response.data;
};

export const fetchGestureLabels = async () => {
  const response = await axios.get(`${API_URL}/labels`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const fetchGestureStats = async () => {
  const response = await axios.get(`${API_URL}/stats`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getModelStatus = async () => {
  const response = await axios.get(`${API_URL}/model-status`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getModelInfo = async () => {
  const response = await axios.get(`${API_URL}/model-info`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const testModel = async () => {
  const response = await axios.get(`${API_URL}/model-test`, {
    headers: authHeaders(),
  });
  return response.data;
};

// Practice Session APIs
export const startPracticeSession = async (gesture, cameraIndex = 0) => {
  const response = await axios.post(`${API_URL}/practice/start`, { 
    gesture, 
    cameraIndex 
  }, {
    headers: authHeaders(),
  });
  return response.data;
};

export const stopPracticeSession = async () => {
  const response = await axios.post(`${API_URL}/practice/stop`, {}, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getPracticeSessionStatus = async () => {
  const response = await axios.get(`${API_URL}/practice/status`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getPracticeSessionLogs = async (since = null) => {
  const params = since ? { since } : {};
  const response = await axios.get(`${API_URL}/practice/logs`, {
    params,
    headers: authHeaders(),
  });
  return response.data;
};

export const startGestureTraining = async (forceRetrain = false) => {
  console.log('startGestureTraining called with:', forceRetrain, typeof forceRetrain);
  const payload = { forceRetrain };
  console.log('Sending payload:', payload);
  
  const response = await axios.post(`${API_URL}/training`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

export const fetchTrainingRuns = async () => {
  const response = await axios.get(`${API_URL}/training`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const fetchTrainingRun = async (runId) => {
  const response = await axios.get(`${API_URL}/training/${runId}`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const cancelTrainingRun = async (runId) => {
  const response = await axios.delete(`${API_URL}/training/${runId}`, {
    headers: authHeaders(),
  });
  return response.data;
};
