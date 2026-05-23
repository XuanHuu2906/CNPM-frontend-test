import apiClient from './apiClient';

export interface AcademicTerm {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
  classes?: any[];
}

export interface Subject {
  id: string;
  subjectCode: string;
  name: string;
}

export interface Class {
  id: string;
  classCode: string;
  subjectId: string;
  termId: string;
  subject: Subject;
  term: AcademicTerm;
  assignments?: any[];
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export interface SystemLog {
  id: string;
  userId: string | null;
  action: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
  user?: {
    email: string;
    fullName: string;
    role: string;
  };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const academicService = {
  // ==========================================
  // HỌC KỲ (ACADEMIC TERMS - UC-19)
  // ==========================================
  getAllTerms: async (): Promise<AcademicTerm[]> => {
    const response = await apiClient.get('/academic/terms');
    return response.data.data;
  },

  createTerm: async (data: { name: string; startDate: string; endDate: string }): Promise<AcademicTerm> => {
    const response = await apiClient.post('/academic/terms', data);
    return response.data.data;
  },

  updateTerm: async (id: string, data: Partial<{ name: string; startDate: string; endDate: string; isLocked: boolean }>): Promise<AcademicTerm> => {
    const response = await apiClient.put(`/academic/terms/${id}`, data);
    return response.data.data;
  },

  // ==========================================
  // MÔN HỌC (SUBJECTS - UC-13)
  // ==========================================
  getAllSubjects: async (): Promise<Subject[]> => {
    const response = await apiClient.get('/academic/subjects');
    return response.data.data;
  },

  createSubject: async (data: { subjectCode: string; name: string }): Promise<Subject> => {
    const response = await apiClient.post('/academic/subjects', data);
    return response.data.data;
  },

  // ==========================================
  // LỚP HỌC PHẦN (CLASSES - UC-13)
  // ==========================================
  getAllClasses: async (): Promise<Class[]> => {
    const response = await apiClient.get('/academic/classes');
    return response.data.data;
  },

  getClassById: async (id: string): Promise<Class> => {
    const response = await apiClient.get(`/academic/classes/${id}`);
    return response.data.data;
  },

  createClass: async (data: { classCode: string; subjectId: string; termId: string }): Promise<Class> => {
    const response = await apiClient.post('/academic/classes', data);
    return response.data.data;
  },

  /**
   * Tạo báo cáo sinh viên
   */
  getStudentReport: async (filters?: { classId?: string }): Promise<any> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', filters.classId);
    
    const response = await apiClient.get(`/academic/reports/students?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Quản lý Yêu cầu mở lại chấm điểm
   */
  getGradingReopenRequests: async (filters?: any): Promise<any> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.semesterId) params.append('semesterId', filters.semesterId);

    const response = await apiClient.get(`/academic/grading-reopen-requests?${params.toString()}`);
    return response.data.data;
  },

  approveGradingReopenRequest: async (id: string, reviewNote?: string): Promise<any> => {
    const response = await apiClient.patch(`/academic/grading-reopen-requests/${id}/approve`, { reviewNote });
    return response.data;
  },

  rejectGradingReopenRequest: async (id: string, reviewNote: string): Promise<any> => {
    const response = await apiClient.patch(`/academic/grading-reopen-requests/${id}/reject`, { reviewNote });
    return response.data;
  },

  // ==========================================
  // PHÂN CÔNG GIẢNG VIÊN (TEACHER ASSIGNMENTS - UC-13)
  // ==========================================
  assignTeacher: async (data: { classId: string; teacherId: string }): Promise<any> => {
    const response = await apiClient.post('/academic/assignments', data);
    return response.data.data;
  },

  unassignTeacher: async (classId: string, teacherId: string): Promise<any> => {
    const response = await apiClient.delete(`/academic/assignments/${classId}/${teacherId}`);
    return response.data.data;
  },

  // ==========================================
  // PHÊ DUYỆT ĐIỂM SỐ (GRADE APPROVALS - UC-16)
  // ==========================================
  approveGrade: async (submissionId: string, data: { isApproved: boolean; version: number }): Promise<any> => {
    const response = await apiClient.put(`/system/grades/${submissionId}/approve`, data);
    return response.data.data;
  },

  // ==========================================
  // TÌM KIẾM TOÀN CỤC (GLOBAL SEARCH)
  // ==========================================
  globalSearch: async (q: string): Promise<{ groups: any[]; submissions: any[]; teachers: any[] }> => {
    const response = await apiClient.get(`/system/search?q=${encodeURIComponent(q)}`);
    return response.data.data;
  },

  // ==========================================
  // XEM BÀI NỘP THEO LỚP
  // ==========================================
  getSubmissionsByClassId: async (classId: string): Promise<any[]> => {
    const response = await apiClient.get(`/submissions/class/${classId}`);
    return response.data.data;
  },

  // ==========================================
  // XEM TOÀN BỘ BÀI NỘP HỆ THỐNG
  // ==========================================
  getAllSubmissions: async (): Promise<any[]> => {
    const response = await apiClient.get('/submissions');
    return response.data.data;
  },
};
