import apiClient from './apiClient';

export interface RubricCriterion {
  id?: string;
  name: string;
  description?: string;
  maxScore: number;
  weight: number;
}

export interface Rubric {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  createdAt: string;
  criteria: RubricCriterion[];
}

export interface TeacherProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatar?: string;
  role: string;
  teacher?: {
    id: string;
    teacherCode: string;
    title?: string;
    assignments: Array<{
      id: string;
      classId: string;
      class: {
        id: string;
        classCode: string;
        subjectId: string;
        termId: string;
        subject: {
          id: string;
          subjectCode: string;
          name: string;
        };
        term: {
          id: string;
          name: string;
          startDate: string;
          endDate: string;
          isLocked: boolean;
        };
      };
    }>;
  };
}

export interface Submission {
  id: string;
  studentId?: string;
  groupId?: string;
  filePath: string;
  attachments?: string;
  status: string;
  version: number;
  editRequestNote?: string;
  rejectReason?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentCode: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  group?: {
    id: string;
    name: string;
    topicName: string;
    students: Array<{
      id: string;
      studentCode: string;
      user: {
        fullName: string;
        email: string;
      };
    }>;
  };
  reopenRequests?: Array<{
    id: string;
    status: string;
    reason?: string;
  }>;
}

export interface Grade {
  id?: string;
  submissionId: string;
  rubricId: string;
  teacherId: string;
  detailedScores: Array<{ criteriaId: string; score: number; note?: string }>;
  finalScore: number;
  feedback?: string;
  isApproved: boolean;
  version: number;
}

export const teacherService = {
  /**
   * Lấy profile đầy đủ của giáo viên kèm các lớp giảng dạy được phân công
   */
  getTeacherProfile: async (): Promise<TeacherProfile> => {
    const response = await apiClient.get('/users/profile');
    return response.data.data;
  },

  /**
   * Lấy toàn bộ nhóm/đề tài của một lớp học phần
   */
  getClassGroups: async (classId: string) => {
    const response = await apiClient.get(`/groups/class/${classId}`);
    return response.data.data;
  },

  /**
   * Lấy toàn bộ bài nộp báo cáo của một lớp học phần
   */
  getClassSubmissions: async (classId: string): Promise<Submission[]> => {
    const response = await apiClient.get(`/submissions/class/${classId}`);
    return response.data.data;
  },

  /**
   * Lấy danh sách Rubric của giảng viên
   */
  getRubrics: async (): Promise<Rubric[]> => {
    const response = await apiClient.get('/rubrics');
    return response.data.data;
  },

  /**
   * Tạo một bảng Rubric mới
   */
  createRubric: async (data: {
    title: string;
    description?: string;
    criteria: Array<{ name: string; description?: string; maxScore: number; weight: number }>;
  }): Promise<Rubric> => {
    const response = await apiClient.post('/rubrics', data);
    return response.data.data;
  },

  /**
   * Xóa một bảng Rubric
   */
  deleteRubric: async (id: string): Promise<void> => {
    await apiClient.delete(`/rubrics/${id}`);
  },

  /**
   * Lấy chi tiết bài nộp của sinh viên theo ID
   */
  getSubmissionById: async (id: string): Promise<Submission> => {
    const response = await apiClient.get(`/submissions/${id}`);
    return response.data.data;
  },

  /**
   * Lấy điểm chi tiết của một bài nộp
   */
  getGradeBySubmissionId: async (submissionId: string): Promise<Grade> => {
    const response = await apiClient.get(`/grades/submission/${submissionId}`);
    return response.data.data;
  },

  /**
   * Chấp thuận yêu cầu nộp lại bài
   */
  approveResubmissionRequest: async (id: string): Promise<any> => {
    const response = await apiClient.patch(`/teacher/resubmission-requests/${id}/approve`);
    return response.data.data;
  },

  /**
   * Tạo yêu cầu mở lại bài nộp
   */
  createReopenRequest: async (submissionId: string, reason: string): Promise<any> => {
    const response = await apiClient.post(`/teacher/submissions/${submissionId}/reopen-request`, { reason });
    return response.data.data;
  },

  /**
   * Chấm điểm hoặc chỉnh sửa điểm chi tiết của bài nộp (có check OCC version)
   */
  submitGrade: async (
    submissionId: string,
    data: {
      rubricId: string;
      detailedScores: Array<{ criteriaId: string; score: number }>;
      feedback?: string;
      version: number; // Phiên bản của bảng điểm hiện tại hoặc mặc định 1
      isDraft?: boolean;
    }
  ): Promise<Grade> => {
    const response = await apiClient.post(`/grades/submission/${submissionId}`, data);
    return response.data.data;
  },

  /**
   * Cập nhật trạng thái bài nộp (duyệt, trả về yêu cầu sửa, từ chối - có check OCC version)
   */
  updateSubmissionStatus: async (
    submissionId: string,
    data: {
      status: string;
      note?: string;
      rejectReason?: string;
      editRequestNote?: string;
      version: number; // Phiên bản của bài nộp (Submission version) để bảo vệ OCC
    }
  ): Promise<Submission> => {
    const response = await apiClient.put(`/submissions/${submissionId}/status`, data);
    return response.data.data;
  },

  /**
   * Gửi thảo luận/bình luận mới cho bài nộp
   */
  addComment: async (submissionId: string, content: string): Promise<any> => {
    const response = await apiClient.post(`/comments/submission/${submissionId}`, { content });
    return response.data.data;
  },

  /**
   * Cập nhật thông tin liên hệ giáo viên
   */
  updateProfile: async (data: { fullName: string; phoneNumber?: string }) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data.data;
  },

  updateAvatar: async (formData: FormData) => {
    const response = await apiClient.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // ==========================================
  // NOTIFICATIONS (Thông báo)
  // ==========================================

  getNotifications: async () => {
    const response = await apiClient.get('/notifications?limit=20');
    return response.data.data;
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // ==========================================
  // GROUP MANAGEMENT (Quản lý nhóm/đề tài)
  // ==========================================

  getAssignedClassSections: async () => {
    const response = await apiClient.get('/teacher/class-sections');
    return response.data.data;
  },

  getStudentsByClassId: async (classId: string) => {
    const response = await apiClient.get(`/teacher/class-sections/${classId}/students`);
    return response.data.data;
  },

  getGroupsByClassId: async (classId: string) => {
    const response = await apiClient.get(`/teacher/class-sections/${classId}/groups`);
    return response.data.data;
  },

  createGroup: async (classId: string, data: { name: string; topicName?: string; studentIds: string[] }) => {
    const response = await apiClient.post(`/teacher/class-sections/${classId}/groups`, data);
    return response.data.data;
  },

  updateGroup: async (groupId: string, data: { name?: string; topicName?: string }) => {
    const response = await apiClient.patch(`/teacher/groups/${groupId}`, data);
    return response.data.data;
  },

  deleteGroup: async (groupId: string) => {
    const response = await apiClient.delete(`/teacher/groups/${groupId}`);
    return response.data.data;
  },

  addMember: async (groupId: string, studentId: string) => {
    const response = await apiClient.post(`/teacher/groups/${groupId}/members`, { studentId });
    return response.data.data;
  },

  removeMember: async (groupId: string, studentId: string) => {
    const response = await apiClient.delete(`/teacher/groups/${groupId}/members/${studentId}`);
    return response.data.data;
  },

  updateGroupTopic: async (groupId: string, topicName: string) => {
    const response = await apiClient.patch(`/teacher/groups/${groupId}/topic`, { topicName });
    return response.data.data;
  },

  importGroupsBatch: async (classId: string, groups: { name: string, topicName?: string, studentCodes: string[] }[]) => {
    const response = await apiClient.post(`/teacher/class-sections/${classId}/groups/import`, { groups });
    return response.data.data;
  },

  autoGenerateGroups: async (classId: string, targetSize: number) => {
    const response = await apiClient.post(`/teacher/class-sections/${classId}/groups/auto-generate`, { targetSize });
    return response.data.data;
  }
};
