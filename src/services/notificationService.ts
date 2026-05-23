import apiClient from './apiClient';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  submissionId?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface GetNotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

export const notificationService = {
  // Lấy danh sách thông báo (phân trang)
  async getNotifications(page = 1, limit = 20): Promise<GetNotificationsResponse> {
    const response = await apiClient.get<GetNotificationsResponse>('/notifications', {
      params: { page, limit },
    });
    return response.data;
  },

  // Đếm số lượng thông báo chưa đọc
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  // Đánh dấu một thông báo đã đọc
  async markAsRead(id: string): Promise<NotificationItem> {
    const response = await apiClient.patch<NotificationItem>(`/notifications/${id}/read`);
    return response.data;
  },

  // Đánh dấu tất cả thông báo là đã đọc
  async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.patch<{ count: number }>('/notifications/read-all');
    return response.data;
  },
};
