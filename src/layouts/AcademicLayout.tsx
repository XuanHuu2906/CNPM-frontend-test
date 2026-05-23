import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { notificationService } from '../services/notificationService';
import {
  Settings,
  LogOut,
  Search,
  Bell,
  Sun,
  Moon,
  BarChart3,
  FileCheck2,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  Check,
  RefreshCcw,
  CheckCircle2,
  Award,
  XCircle,
  Calendar as CalendarIcon
} from 'lucide-react';

export default function AcademicLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await notificationService.getNotifications();
        if (data && data.notifications) {
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error('Lỗi tải thông báo:', error);
      }
    };
    if (user?.role === 'PHONG_DAO_TAO') {
      fetchNotifs();
    }
  }, [user]);

  const handleNotificationClick = async (notif: any) => {
    setIsNotifOpen(false);
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications(prev => 
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const getIconAndColor = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('duyệt') || titleLower.includes('thành công')) {
      return { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30' };
    } else if (titleLower.includes('điểm') || titleLower.includes('kết quả') || titleLower.includes('chấm')) {
      return { icon: Award, color: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30' };
    } else if (titleLower.includes('sửa') || titleLower.includes('yêu cầu') || titleLower.includes('từ chối')) {
      return { icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30' };
    }
    return { icon: CalendarIcon, color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30' };
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Kiểm tra trạng thái khóa học kỳ thời gian thực
  useEffect(() => {
    const checkLock = () => {
      setIsLocked(localStorage.getItem('academic-semester-locked') === 'true');
    };
    checkLock();
    // Lắng nghe sự kiện storage để đồng bộ tức thì giữa các tab
    window.addEventListener('storage', checkLock);
    return () => window.removeEventListener('storage', checkLock);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      title: 'Giám sát tiến độ',
      path: '/academic/dashboard',
      icon: BarChart3
    },
    {
      title: 'Phê duyệt kết quả',
      path: '/academic/approvals',
      icon: FileCheck2
    },
    {
      title: 'Yêu cầu mở lại',
      path: '/academic/reopen-requests',
      icon: RefreshCcw
    },
    {
      title: 'Điều phối giảng dạy',
      path: '/academic/assignment',
      icon: Users
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
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 text-white font-black text-xl shrink-0">
              A
            </div>
            {!isCollapsed && (
              <div className="text-left animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100 tracking-tight">EduGrade</h2>
                <p className="text-xs text-muted-foreground font-medium">Academic Admin Hub</p>
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
                    ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  itemActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500'
                }`} />
                {!isCollapsed && <span className="animate-in fade-in duration-300">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM UTILITY LINKS */}
        <div className={`p-4 border-t border-slate-100 dark:border-slate-800 space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
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
                <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-500/20 text-white font-black text-lg shrink-0">
                  A
                </div>
                <div className="text-left hidden sm:block">
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">EduGrade</h2>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">Academic Admin Hub</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* CENTER HEADER AREA: Spacer */}
          <div className="flex-1" />

          {/* RIGHT HEADER AREA: Profile & Utilities */}
          <div className="w-64 flex items-center justify-end gap-5 shrink-0">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 border border-slate-200/80 dark:border-slate-800/80 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
              title="Chuyển chế độ sáng tối"
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
                      onClick={() => { setIsNotifOpen(false); }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Đóng
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
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop"
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {user?.fullName || 'Phòng Đào Tạo'}
                </p>
                <p className="text-xs text-muted-foreground font-semibold leading-none mt-1">
                  Chuyên viên quản lý
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 overflow-auto p-8 bg-slate-50/50 dark:bg-slate-950/50">
          {isLocked && (
            <div className="mb-6 p-4 bg-amber-500 dark:bg-amber-600 text-white rounded-2xl font-bold flex items-center justify-between shadow-md animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-white/20 rounded-xl"><ShieldAlert className="w-5 h-5" /></span>
                <div>
                  <h4 className="text-sm font-extrabold leading-none">Học kỳ hiện tại đang khóa điểm</h4>
                  <p className="text-xs text-amber-50 font-semibold mt-1">Tất cả chức năng sửa điểm của Giảng viên và nộp bài của Sinh viên đã bị vô hiệu hóa toàn cục.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  localStorage.setItem('academic-semester-locked', 'false');
                  setIsLocked(false);
                  window.dispatchEvent(new Event('storage'));
                }}
                className="px-4 py-2 bg-white text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-50 active:scale-95 transition-all shadow-sm"
              >
                Mở khóa ngay
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
