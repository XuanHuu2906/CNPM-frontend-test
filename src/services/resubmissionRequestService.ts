import api from './apiClient';

export interface ResubmissionRequest {
  id: string;
  submissionId: string;
  studentId: string;
  reason: string;
  status: 'CHO_XU_LY' | 'DA_DUYET' | 'TU_CHOI';
  createdAt: string;
  reviewerId?: string;
  feedbackNote?: string;
  student?: {
    studentCode: string;
    user: { fullName: string };
  };
  submission?: {
    id: string;
    version: number;
    status: string;
    filePath: string;
    attachments: string | null;
  };
  reviewer?: {
    user: { fullName: string };
  };
}

export const resubmissionRequestService = {
  createRequest: async (submissionId: string, reason: string): Promise<ResubmissionRequest> => {
    const response = await api.post('/resubmission-requests', { submissionId, reason });
    return response.data.data;
  },

  getMyRequests: async (): Promise<ResubmissionRequest[]> => {
    const response = await api.get('/resubmission-requests/my');
    return response.data.data;
  },

  getTeacherPendingRequests: async (): Promise<ResubmissionRequest[]> => {
    const response = await api.get('/resubmission-requests/teacher');
    return response.data.data;
  },

  updateStatus: async (requestId: string, status: 'DA_DUYET' | 'TU_CHOI', feedbackNote?: string): Promise<ResubmissionRequest> => {
    const response = await api.put(`/resubmission-requests/${requestId}/status`, { status, feedbackNote });
    return response.data.data;
  }
};
