import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s timeout for video uploads
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
