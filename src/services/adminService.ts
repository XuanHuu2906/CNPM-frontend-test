import apiClient from './apiClient';
import type { User, SystemConfig, SystemLog } from './academicService';

export interface BackupFile {
  id: string;
  fileName: string;
  fileSize: string;
  createdAt: string;
  type: string;
  creator: string;
}

export interface BackupListResponse {
  backups: BackupFile[];
  latestBackupAt: string | null;
  latestBackupStatus: string | null;
  latestRestoreAt: string | null;
  latestRestoredBackupId: string | null;
  latestRestoredBackupFile: string | null;
  latestRestoredBy: string | null;
  latestRestoreStatus: string | null;
}

export const adminService = {
  // 1. Lấy danh sách tài khoản toàn bộ hệ thống
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data.data;
  },

  // 2. Tạo tài khoản người dùng thủ công
  createUser: async (data: any): Promise<User> => {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  // 3. Nhập hàng loạt tài khoản người dùng
  createUsersBatch: async (users: any[]): Promise<any> => {
    const response = await apiClient.post('/users/batch', { users });
    return response.data.data;
  },

  // 4. Khóa/mở khóa hoặc cập nhật vai trò tài khoản
  updateUserRoleStatus: async (id: string, role: string, isActive: boolean): Promise<User> => {
    const response = await apiClient.put(`/users/${id}/role-status`, { role, isActive });
    return response.data.data;
  },

  // 5. Cấp lại mật khẩu mới cho tài khoản người dùng
  resetUserPassword: async (id: string, password: string): Promise<User> => {
    const response = await apiClient.put(`/users/${id}/reset-password`, { password });
    return response.data.data;
  },

  // 6. Xem danh sách các tham số cấu hình hệ thống
  getConfigs: async (): Promise<SystemConfig[]> => {
    const response = await apiClient.get('/system/configs');
    return response.data.data;
  },

  // 7. Cập nhật tham số cấu hình hệ thống
  updateConfig: async (key: string, value: string, description?: string): Promise<SystemConfig> => {
    const response = await apiClient.put('/system/configs', { key, value, description });
    return response.data.data;
  },

  // 8. Xem nhật ký hoạt động phân trang
  getLogs: async (page: number = 1, limit: number = 20): Promise<{ logs: SystemLog[]; total: number; pages: number }> => {
    const response = await apiClient.get(`/system/logs?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // 9. Xem danh sách các file sao lưu hiện có trên máy chủ
  listBackups: async (): Promise<BackupListResponse> => {
    const response = await apiClient.get('/system/backups');
    return response.data.data;
  },

  // 10. Tạo bản sao lưu cơ sở dữ liệu mới (dump và trả về thông tin)
  backupDb: async (): Promise<any> => {
    const response = await apiClient.post('/system/backup');
    return response.data.data;
  },

  // 11. Khôi phục cơ sở dữ liệu từ file sao lưu JSON di động
  restoreDb: async (backupFile: string): Promise<any> => {
    const response = await apiClient.post('/system/restore', { backupFile });
    return response.data.data;
  },

  // 12. Xóa tệp sao lưu khỏi ổ đĩa máy chủ
  deleteBackup: async (filename: string): Promise<any> => {
    const response = await apiClient.delete(`/system/backups/${filename}`);
    return response.data.data;
  },

  // 12.1. Tải xuống tệp tin sao lưu cơ sở dữ liệu
  downloadBackup: async (filename: string): Promise<Blob> => {
    const response = await apiClient.get(`/system/backups/${filename}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // 13. Nhập học kỳ hàng loạt
  createTermsBatch: async (terms: any[]): Promise<any> => {
    const response = await apiClient.post('/academic/terms/batch', { terms });
    return response.data.data;
  },

  // 14. Nhập lớp học phần hàng loạt
  createClassesBatch: async (classes: any[]): Promise<any> => {
    const response = await apiClient.post('/academic/classes/batch', { classes });
    return response.data.data;
  },

  // 15. Nhập phân công giảng dạy hàng loạt (cũ) -> Nhập đăng ký LHP (mới)
  createEnrollmentsBatch: async (enrollments: any[]): Promise<any> => {
    const response = await apiClient.post('/academic/enrollments/batch', { enrollments });
    return response.data.data;
  },

  // 16. Lấy thống kê khóa điểm học kỳ
  getSemesterLockStats: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/system/semesters/${id}/lock-stats`);
    return response.data.data;
  },

  // 17. Thực hiện khóa điểm học kỳ vĩnh viễn
  lockSemester: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/system/semesters/${id}/lock`);
    return response.data.data;
  }
};
export default adminService;
