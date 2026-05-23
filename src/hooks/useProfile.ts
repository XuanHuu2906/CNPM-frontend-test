import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

const mapBackendRoleToFrontend = (backendRole: string): string => {
  switch (backendRole) {
    case 'STUDENT': return 'SINH_VIEN';
    case 'TEACHER': return 'GIANG_VIEN';
    case 'ACADEMIC_DEPT': return 'PHONG_DAO_TAO';
    case 'ADMIN': return 'ADMIN';
    default: return backendRole;
  }
};

export function useProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/users/profile');
      const profileData = res.data.data;
      if (profileData?.role) {
        profileData.role = mapBackendRoleToFrontend(profileData.role);
      }
      return profileData;
    },
    staleTime: 10 * 1000, // 10 seconds to ensure quick updates
  });
}
