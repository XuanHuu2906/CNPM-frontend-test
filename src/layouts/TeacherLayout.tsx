import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  Sun,
  Moon,
  FolderKanban,
  FileCheck2,
  Sliders,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MessageSquareWarning,
  CheckCircle2,
  Award,
  XCircle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { teacherService } from '../services/teacherService';

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await teacherService.getNotifications();
        if (data && data.notifications) {
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error('Lỗi tải thông báo:', error);
      }
    };
    if (user?.role === 'GIANG_VIEN') {
      fetchNotifs();
    }
  }, [user]);

  const handleNotificationClick = async (notif: any) => {
    setIsNotifOpen(false);
    if (!notif.isRead) {
      try {
        await teacherService.markNotificationAsRead(notif.id);
        setNotifications(prev => 
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    const title = notif.title.toLowerCase();
    if (title.includes('nộp lại') || title.includes('yêu cầu')) {
      navigate('/teacher/resubmission-requests');
    } else if (title.includes('nộp') || title.includes('báo cáo')) {
      navigate('/teacher/grading');
    }
  };

  const getIconAndColor = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('nộp') && !titleLower.includes('lại')) {
      return { icon: FileCheck2, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30' };
    } else if (titleLower.includes('nộp lại') || titleLower.includes('yêu cầu')) {
      return { icon: MessageSquareWarning, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30' };
    }
    return { icon: Bell, color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30' };
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Đồng bộ trạng thái khóa học kỳ
  useEffect(() => {
    const checkLock = () => {
      setIsLocked(localStorage.getItem('academic-semester-locked') === 'true');
    };
    checkLock();
    window.addEventListener('storage', checkLock);
    return () => window.removeEventListener('storage', checkLock);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      title: 'Quản lý Lớp học phần',
      path: '/teacher/dashboard',
      icon: FolderKanban
    },
    {
      title: 'Thiết kế Rubric',
      path: '/teacher/rubrics',
      icon: Sliders
    },
    {
      title: 'Quản lý nhóm',
      path: '/teacher/groups',
      icon: Users
    },
    {
      title: 'Chấm điểm báo cáo',
      path: '/teacher/grading',
      icon: FileCheck2
    },
    {
      title: 'Thống kê kết quả',
      path: '/teacher/statistics',
      icon: BarChart3
    },
    {
      title: 'Yêu cầu nộp lại',
      path: '/teacher/resubmission-requests',
      icon: MessageSquareWarning
    }
  ];

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* SIDEBAR */}
      <aside className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen sticky top-0 hidden md:flex shrink-0 transition-all duration-300 ease-in-out`}>
        
        {/* LOGO AREA */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-black text-xl shrink-0">
              T
            </div>
            {!isCollapsed && (
              <div className="text-left animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">EduGrade</h2>
                <p className="text-xs text-muted-foreground font-medium">Teacher Evaluation Hub</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all ml-2"
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-4 space-y-1 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const itemActive = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.title : undefined}
                className={`flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'px-4'
                } ${
                  itemActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  itemActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                }`} />
                {!isCollapsed && <span className="animate-in fade-in duration-300">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM UTILITY LINKS */}
        <div className={`p-4 border-t border-slate-100 dark:border-slate-800 space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <Link
            to="/teacher/settings"
            title={isCollapsed ? "Cài đặt" : undefined}
            className={`flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group text-left ${
              isCollapsed ? 'justify-center px-0 w-10 h-10' : 'px-4 w-full'
            } ${
              isActive('/teacher/settings')
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Settings className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              isActive('/teacher/settings') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
            }`} />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Cài đặt</span>}
          </Link>
          <button
            onClick={logout}
            title={isCollapsed ? "Đăng xuất" : undefined}
            className={`flex items-center gap-3 py-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all ${
              isCollapsed ? 'justify-center px-0 w-10 h-10' : 'px-4 w-full'
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex flex-1 flex-col overflow-hidden h-screen">
        <header className="flex h-20 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 px-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shrink-0">
          
          {/* LEFT HEADER AREA: Logo appears ONLY when sidebar is collapsed */}
          <div className="w-64 flex items-center shrink-0">
            {isCollapsed ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-lg shrink-0">
                  T
                </div>
                <div className="text-left hidden sm:block">
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">EduGrade</h2>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">Teacher Evaluation Hub</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* CENTER HEADER AREA: Centered Search Bar */}
          <div className="flex-1 flex justify-center max-w-xl mx-auto px-4">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm lớp học phần, đề tài..."
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          {/* RIGHT HEADER AREA: Profile & Utilities */}
          <div className="w-64 flex items-center justify-end gap-5 shrink-0">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 border border-slate-200/80 dark:border-slate-800/80 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2.5 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Thông báo mới</h3>
                    <button 
                      onClick={() => { setIsNotifOpen(false); navigate('/teacher/notifications'); }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Xem tất cả
                    </button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.length > 0 ? notifications.slice(0, 5).map(notif => {
                      const { icon: Icon, color } = getIconAndColor(notif.title);
                      const timeString = new Date(notif.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
                      return (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex gap-3.5 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative ${!notif.isRead ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}
                        >
                          {!notif.isRead && <div className="absolute top-4 right-3 w-2 h-2 bg-rose-500 rounded-full shadow-sm" />}
                          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <p className={`text-sm font-bold truncate ${!notif.isRead ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>{notif.title}</p>
                            <p className={`text-xs truncate mt-0.5 ${!notif.isRead ? 'text-slate-600 dark:text-slate-400 font-medium' : 'text-slate-500'}`}>{notif.content}</p>
                            <span className="text-[10px] font-semibold text-slate-400 mt-1 block">{timeString}</span>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="py-10 text-center text-slate-500 text-sm font-medium flex flex-col items-center gap-2">
                        <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                        Chưa có thông báo nào
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop"
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {user?.fullName || 'TS. Nguyễn Văn A'}
                </p>
                <p className="text-xs text-muted-foreground font-medium leading-none mt-1">
                  Giảng viên
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 bg-slate-50/50 dark:bg-slate-950/50">
          {isLocked && (
            <div className="mb-6 p-4 bg-rose-600 dark:bg-rose-700 text-white rounded-2xl font-bold flex items-center gap-3.5 shadow-md animate-in fade-in duration-300 text-left">
              <span className="p-1.5 bg-white/20 rounded-xl">🚨</span>
              <div>
                <h4 className="text-sm font-extrabold leading-none">Học kỳ này đã bị khóa điểm</h4>
                <p className="text-xs text-rose-100 font-semibold mt-1">Học kỳ này đã bị khóa điểm, mọi chức năng sửa đổi dữ liệu đã bị đóng băng.</p>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
