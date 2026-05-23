import apiClient from './apiClient';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data.data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await apiClient.post('/auth/change-password', { oldPassword, newPassword });
    return response.data.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data.data;
  },
};
