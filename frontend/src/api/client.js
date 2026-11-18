import axios from 'axios';

const RAW_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
const API_BASE_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;
export const SERVER_BASE_URL = (
  import.meta.env.VITE_SERVER_URL ||
  API_BASE_URL.replace(/\/api$/, '')
).replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export const api = {
  // Check backend server connection and health
  checkHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Fetch overview match statistics (DEMO data)
  getOverviewAnalytics: async () => {
    const response = await apiClient.get('/analytics/overview');
    return response.data;
  },

  // Upload video file with upload progress callback
  uploadVideo: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/video/upload', formData, {
      timeout: 300000, // 5 min timeout for large match video uploads
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (onUploadProgress) {
            onUploadProgress(percentCompleted);
          }
        }
      },
    });
    return response.data;
  },

  // Get recently uploaded match videos
  getRecentVideos: async () => {
    const response = await apiClient.get('/video/recent');
    return response.data;
  },

  // Get video job status
  getVideoStatus: async (videoId) => {
    const response = await apiClient.get(`/video/status/${videoId}`);
    return response.data;
  },

  // Trigger CV analysis pipeline (YOLO11 + ByteTrack)
  startVideoAnalysis: async (videoId, conf = 0.25, force = false) => {
    const response = await apiClient.post(`/video/${videoId}/analyze?conf=${conf}&force=${force}`);
    return response.data;
  },

  // Get authentic computed computer vision tracking analytics
  getRealVideoAnalytics: async (videoId) => {
    const response = await apiClient.get(`/analytics/${videoId}`);
    return response.data;
  },

  // Resolve video stream URL for playback
  getVideoStreamUrl: (filenameOrStreamUrl) => {
    if (!filenameOrStreamUrl) return null;
    if (filenameOrStreamUrl.startsWith('http://') || filenameOrStreamUrl.startsWith('https://')) {
      return filenameOrStreamUrl;
    }
    const cleanPath = filenameOrStreamUrl.startsWith('/')
      ? filenameOrStreamUrl
      : `/uploads/${filenameOrStreamUrl}`;
    return `${SERVER_BASE_URL}${cleanPath}`;
  },
};

export default apiClient;
