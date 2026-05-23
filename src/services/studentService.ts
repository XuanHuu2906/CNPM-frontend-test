import apiClient from './apiClient';

export const studentService = {
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data.data;
  },

  getGroup: async (groupId: string) => {
    const response = await apiClient.get(`/groups/${groupId}`);
    return response.data.data;
  },

  getMySubmission: async () => {
    const response = await apiClient.get('/submissions/my');
    return response.data.data;
  },

  getNotifications: async () => {
    const response = await apiClient.get('/notifications');
    return response.data.data;
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllNotificationsAsRead: async () => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },

  uploadFile: async (formData: FormData, onProgress?: (progress: number) => void) => {
    const response = await apiClient.post('/submissions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
    return response.data.data;
  },

  submitReport: async (data: { filePath: string; attachments?: string[]; classId?: string }) => {
    const response = await apiClient.post('/submissions/submit', data);
    return response.data.data;
  },

  addComment: async (submissionId: string, content: string) => {
    const response = await apiClient.post(`/comments/submission/${submissionId}`, { content });
    return response.data.data;
  },

  exportPdf: async (submissionId: string) => {
    const response = await apiClient.get(`/submissions/${submissionId}/export-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  updateAvatar: async (formData: FormData) => {
    const response = await apiClient.put('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await apiClient.post('/auth/change-password', { oldPassword, newPassword });
    return response.data.data;
  },
};
