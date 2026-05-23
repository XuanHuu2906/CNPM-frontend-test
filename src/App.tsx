import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { PrivateRoute, PublicRoute, RoleRoute } from './components/GuardRoutes';

// Role-specific Layouts
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import AcademicLayout from './layouts/AcademicLayout';

// Auth page
import Login from './pages/auth/Login';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSubmit from './pages/student/StudentSubmit';
import StudentEvaluation from './pages/student/StudentEvaluation';
import StudentSettings from './pages/student/StudentSettings';
import StudentNotifications from './pages/student/StudentNotifications';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import RubricDesigner from './pages/teacher/RubricDesigner';
import GradingWorkshop from './pages/teacher/GradingWorkshop';
import GroupManagement from './pages/teacher/GroupManagement';
import TeacherStatistics from './pages/teacher/TeacherStatistics';
import ResubmissionRequests from './pages/teacher/ResubmissionRequests';
import TeacherSettings from './pages/teacher/TeacherSettings';
import TeacherNotifications from './pages/teacher/TeacherNotifications';

// Academic pages
import AcademicDashboard from './pages/academic/AcademicDashboard';
import AcademicApprovals from './pages/academic/AcademicApprovals';
import AcademicAssignment from './pages/academic/AcademicAssignment';
import AcademicTerms from './pages/academic/AcademicTerms';
import GradingReopenRequests from './pages/academic/GradingReopenRequests';

// Admin Layout & Pages
import AdminLayout from './layouts/AdminLayout';
import AccountManagement from './pages/admin/AccountManagement';
import BatchImporter from './pages/admin/BatchImporter';
import SystemAuditTrail from './pages/admin/SystemAuditTrail';
import SystemSettings from './pages/admin/SystemSettings';
import DataBackupRestore from './pages/admin/DataBackupRestore';
import ProgressMonitoring from './pages/admin/ProgressMonitoring';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Component điều hướng thông minh dựa trên Role khi vào trang chủ "/"
function NavigateToDashboardByRole() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'ADMIN': return <Navigate to="/admin" replace />;
    case 'SINH_VIEN': return <Navigate to="/student/dashboard" replace />;
    case 'GIANG_VIEN': return <Navigate to="/teacher/dashboard" replace />;
    case 'PHONG_DAO_TAO': return <Navigate to="/academic/dashboard" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
              <Routes>
                {/* Route Đăng nhập */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                
                {/* Chuyển hướng Trang chủ "/" dựa trên Role */}
                <Route path="/" element={<PrivateRoute><NavigateToDashboardByRole /></PrivateRoute>} />
                
                {/* 1. KHÔNG GIAN SINH VIÊN (STUDENT LAYOUT & ROUTES) */}
                <Route path="student" element={<PrivateRoute><RoleRoute roles={['SINH_VIEN']}><StudentLayout /></RoleRoute></PrivateRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="submit" element={<StudentSubmit />} />
                  <Route path="evaluation" element={<StudentEvaluation />} />
                  <Route path="notifications" element={<StudentNotifications />} />
                  <Route path="settings" element={<StudentSettings />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>
 
                {/* 2. KHÔNG GIAN GIẢNG VIÊN (TEACHER LAYOUT & ROUTES) */}
                <Route path="teacher" element={<PrivateRoute><RoleRoute roles={['GIANG_VIEN']}><TeacherLayout /></RoleRoute></PrivateRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="rubrics" element={<RubricDesigner />} />
                  <Route path="grading" element={<GradingWorkshop />} />
                  <Route path="groups" element={<GroupManagement />} />
                  <Route path="notifications" element={<TeacherNotifications />} />
                  <Route path="resubmission-requests" element={<ResubmissionRequests />} />
                  <Route path="statistics" element={<TeacherStatistics />} />
                  <Route path="settings" element={<TeacherSettings />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>
 
                {/* 3. KHÔNG GIAN PHÒNG ĐÀO TẠO */}
                <Route path="academic" element={<PrivateRoute><RoleRoute roles={['PHONG_DAO_TAO']}><AcademicLayout /></RoleRoute></PrivateRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AcademicDashboard />} />
                  <Route path="approvals" element={<AcademicApprovals />} />
                  <Route path="assignment" element={<AcademicAssignment />} />
                  <Route path="terms" element={<AcademicTerms />} />
                  <Route path="reopen-requests" element={<GradingReopenRequests />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>
 
                {/* 4. KHÔNG GIAN QUẢN TRỊ VIÊN */}
                <Route path="admin" element={<PrivateRoute><RoleRoute roles={['ADMIN']}><AdminLayout /></RoleRoute></PrivateRoute>}>
                  <Route index element={<Navigate to="accounts" replace />} />
                  <Route path="accounts" element={<AccountManagement />} />
                  <Route path="importer" element={<BatchImporter />} />
                  <Route path="monitoring" element={<ProgressMonitoring />} />
                  <Route path="audit" element={<SystemAuditTrail />} />
                  <Route path="backup" element={<DataBackupRestore />} />
                  <Route path="settings" element={<SystemSettings />} />
                  <Route path="*" element={<Navigate to="accounts" replace />} />
                </Route>
 
                {/* Fallback mặc định */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster position="top-right" richColors />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
