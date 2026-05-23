import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Clock,
  BarChart2,
  Settings,
  LogOut,
  Plus,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  FileUp,
  X,
  Loader2,
  Users,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../services/apiClient';
import { studentService } from '../services/studentService';
import { CheckCircle2, Award, XCircle, Calendar as CalendarIcon } from 'lucide-react';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLocked, setIsLocked] = useState(() =>
    localStorage.getItem('academic-semester-locked') === 'true'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await studentService.getNotifications();
        if (data && data.notifications) {
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error('Lỗi tải thông báo:', error);
      }
    };
    if (user?.role === 'SINH_VIEN') {
      fetchNotifs();
    }
  }, [user]);

  const handleNotificationClick = async (notif: any) => {
    setIsNotifOpen(false);
    if (!notif.isRead) {
      try {
        await studentService.markNotificationAsRead(notif.id);
        setNotifications(prev => 
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    const title = notif.title.toLowerCase();
    if (title.includes('nộp') && title.includes('thành công')) {
      navigate('/student/submit');
    } else if (title.includes('yêu cầu') || title.includes('sửa') || title.includes('từ chối') || title.includes('hạn') || title.includes('deadline')) {
      navigate('/student/submit');
    } else if (title.includes('chấm') || title.includes('kết quả') || title.includes('duyệt')) {
      navigate('/student/evaluation');
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

  const handleSearchSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        setIsSearching(true);
        setIsSearchOpen(true);
        const response = await apiClient.get(`/system/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(response.data.data);
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        toast.error('Tìm kiếm thất bại. Vui lòng thử lại!');
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Fetch system configs with 5min cache — no redundant calls on re-mount
  const { data: configs } = useQuery({
    queryKey: ['system-configs'],
    queryFn: async () => {
      const res = await apiClient.get('/system/configs');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Compute semester lock state when configs or user profile changes
  useEffect(() => {
    if (!configs) return;
    const lockConfig = configs.find((c: any) => c.key === 'academic-semester-locked');
    const isGlobalLocked = lockConfig?.value === 'true' || lockConfig?.value === true;
    const isTermLocked = (user as any)?.student?.class?.term?.isLocked || false;
    const finalLockState = isGlobalLocked || isTermLocked;
    setIsLocked(finalLockState);
    localStorage.setItem('academic-semester-locked', String(finalLockState));
  }, [configs, user]);

  // Sync lock state across browser tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLocked(localStorage.getItem('academic-semester-locked') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleCreateReport = () => {
    navigate('/student/submit');
    toast.info('Đã chuyển đến khu vực nộp báo cáo mới!');
  };

  const navItems = [
    {
      title: 'Bảng điều khiển',
      path: '/student/dashboard',
      icon: LayoutDashboard
    },
    {
      title: 'Nộp báo cáo',
      path: '/student/submit',
      icon: FileUp
    },
    {
      title: 'Tiến độ chấm',
      path: '/student/evaluation',
      icon: Clock
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
              E
            </div>
            {!isCollapsed && (
              <div className="text-left animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">EduGrade</h2>
                <p className="text-xs text-muted-foreground font-medium">Hệ thống quản lý điểm</p>
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

        {/* CREATE BUTTON */}
        <div className="px-4 py-4 flex justify-center">
          <button
            onClick={handleCreateReport}
            className={`flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-semibold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all text-sm ${
              isCollapsed ? 'w-10 h-10 p-0 rounded-full' : 'w-full px-4'
            }`}
            title="Tạo báo cáo mới"
          >
            <Plus className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Tạo báo cáo mới</span>}
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-4 space-y-1 py-2 overflow-y-auto">
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
            to="/student/settings"
            title={isCollapsed ? "Cài đặt" : undefined}
            className={`flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group text-left ${
              isCollapsed ? 'justify-center px-0 w-10 h-10' : 'px-4 w-full'
            } ${
              isActive('/student/settings')
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Settings className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              isActive('/student/settings') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
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
                  E
                </div>
                <div className="text-left hidden sm:block">
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">EduGrade</h2>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">Hệ thống quản lý điểm</p>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Tìm kiếm đề tài, thông tin báo cáo..."
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          {/* RIGHT HEADER AREA: Profile & Utilities */}
          <div className="w-64 flex items-center justify-end gap-5 shrink-0">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
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
                      onClick={() => { setIsNotifOpen(false); navigate('/student/notifications'); }}
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
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {user?.fullName || 'Nguyễn Văn A'}
                </p>
                <p className="text-xs text-muted-foreground font-medium leading-none mt-1 uppercase tracking-wide">
                  {user?.identifier || 'Sinh viên'}
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

      {/* GLOBAL SEARCH RESULTS MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  Kết quả tìm kiếm cho: "{searchQuery}"
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchResults(null);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isSearching ? (
                <div className="h-full w-full flex flex-col items-center justify-center gap-4 py-20">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-500">Đang truy vấn dữ liệu từ máy chủ...</p>
                </div>
              ) : (
                <>
                  {/* Section 1: Đề tài & Nhóm */}
                  <div>
                    <h4 className="text-xs font-black tracking-widest uppercase text-slate-400 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      Nhóm & Đề tài học phần ({searchResults?.groups?.length || 0})
                    </h4>
                    {searchResults?.groups && searchResults.groups.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {searchResults.groups.map((group: any) => (
                          <div key={group.id} className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-left">
                            <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{group.name}</h5>
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">Đề tài: {group.topicName || 'Chưa đăng ký'}</p>
                            <div className="mt-3 space-y-1">
                              {group.students?.map((std: any) => (
                                <p key={std.id} className="text-[11px] text-slate-500 font-medium">
                                  👤 {std.user?.fullName} ({std.user?.email})
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic pl-6">Không tìm thấy nhóm đề tài phù hợp.</p>
                    )}
                  </div>

                  {/* Section 2: Bài nộp báo cáo */}
                  <div>
                    <h4 className="text-xs font-black tracking-widest uppercase text-slate-400 mb-3 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                      Báo cáo & Bài nộp ({searchResults?.submissions?.length || 0})
                    </h4>
                    {searchResults?.submissions && searchResults.submissions.length > 0 ? (
                      <div className="space-y-2.5">
                        {searchResults.submissions.map((sub: any) => (
                          <div key={sub.id} className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                            <div>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                {sub.group ? `Nhóm: ${sub.group.name}` : `Sinh viên: ${sub.student?.user?.fullName}`}
                              </p>
                              <h5 className="font-bold text-slate-700 dark:text-slate-300 text-sm mt-1 truncate max-w-md">
                                📂 {sub.filePath.split('/').pop()}
                              </h5>
                              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                                Ngày nộp: {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full self-start md:self-auto border ${
                              sub.status === 'DA_CHAM' || sub.status === 'HOAN_THANH'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700'
                                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700'
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic pl-6">Không tìm thấy bài nộp báo cáo phù hợp.</p>
                    )}
                  </div>

                  {/* Section 3: Giảng viên */}
                  <div>
                    <h4 className="text-xs font-black tracking-widest uppercase text-slate-400 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      Giảng viên hướng dẫn ({searchResults?.teachers?.length || 0})
                    </h4>
                    {searchResults?.teachers && searchResults.teachers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {searchResults.teachers.map((tc: any) => (
                          <div key={tc.id} className="p-3.5 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-3 text-left">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                              {tc.user?.fullName.charAt(0)}
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-none">{tc.user?.fullName}</h5>
                              <p className="text-[10px] font-medium text-slate-400 mt-1">Mã GV: {tc.teacherCode}</p>
                              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{tc.user?.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic pl-6">Không tìm thấy giảng viên hướng dẫn phù hợp.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex justify-end">
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchResults(null);
                }}
                className="px-5 py-2 text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-slate-100 dark:text-slate-950 rounded-xl transition-all shadow-md active:scale-95"
              >
                Đóng kết quả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
