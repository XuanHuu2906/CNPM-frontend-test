import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
});

// Interceptor: Đính kèm Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Xử lý lỗi toàn cục (Global Error Handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // Xử lý Lỗi Tranh chấp Dữ liệu (Optimistic Locking - OCC)
      if (status === 409) {
        console.error('Dữ liệu đã bị thay đổi bởi người khác! Vui lòng tải lại trang.');
        window.dispatchEvent(new CustomEvent('conflictError'));
      }

      if (status === 401) {
        // Token hết hạn — dọn localStorage và để AuthContext xử lý điều hướng
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
