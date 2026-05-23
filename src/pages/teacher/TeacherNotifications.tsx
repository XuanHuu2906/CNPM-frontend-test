import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Award, XCircle, Calendar, Bell, Loader2, Filter, AlertTriangle, Clock, MessageSquareWarning, FileCheck2 } from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import type { NotificationItem } from '../../types';
import { toast } from 'sonner';

type FilterType = 'ALL' | 'UNREAD' | 'IMPORTANT' | 'SUBMISSION' | 'RESULT';

export default function TeacherNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getNotifications();
      if (data && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Không thể tải thông báo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Assuming teacherService has markAllNotificationsAsRead if we add it, but for now we might not have it.
      // Let's implement it manually or just use the backend if it exists. 
      // Wait, there's no markAllNotificationsAsRead in teacherService. Let's just do it individually for now or skip the button.
      // We will just do a loop for unread.
      const unreads = notifications.filter(n => !n.isRead);
      await Promise.all(unreads.map(n => teacherService.markNotificationAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Có lỗi xảy ra khi đánh dấu đã đọc');
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await teacherService.markNotificationAsRead(notif.id);
        // Update local state
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
    } else {
      navigate('/teacher/dashboard');
    }
  };

  const getFilteredNotifications = () => {
    return notifications.filter(notif => {
      const titleLower = notif.title.toLowerCase();
      
      switch (filter) {
        case 'UNREAD':
          return !notif.isRead;
        case 'IMPORTANT':
          return titleLower.includes('yêu cầu') || titleLower.includes('nộp lại');
        case 'SUBMISSION':
          return titleLower.includes('nộp') || titleLower.includes('báo cáo');
        case 'RESULT':
          return titleLower.includes('chấm');
        case 'ALL':
        default:
          return true;
      }
    });
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

  const filteredNotifs = getFilteredNotifications();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/teacher/dashboard')}
            className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Trở về Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-500" />
            Thông báo
          </h1>
          <p className="text-slate-500 font-medium mt-1">Cập nhật các thông tin mới nhất về lớp học phần của bạn</p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Filter className="w-4 h-4 text-slate-400 mr-1" />
        {[
          { id: 'ALL', label: 'Tất cả' },
          { id: 'UNREAD', label: 'Chưa đọc' },
          { id: 'IMPORTANT', label: 'Quan trọng' },
          { id: 'SUBMISSION', label: 'Nộp bài' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as FilterType)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              filter === f.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="font-semibold text-sm">Đang tải thông báo...</span>
          </div>
        ) : filteredNotifs.length > 0 ? (
          filteredNotifs.map((notif) => {
            const { icon: Icon, color } = getIconAndColor(notif.title);
            const timeString = new Date(notif.createdAt).toLocaleDateString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit'
            });

            return (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`relative group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  notif.isRead 
                    ? 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm' 
                    : 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/50 hover:shadow-md'
                }`}
              >
                {!notif.isRead && (
                  <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-sm shadow-rose-500/40" />
                )}
                
                <div className="flex gap-4 sm:gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className={`text-base font-bold truncate mb-1 ${notif.isRead ? 'text-slate-700 dark:text-slate-200' : 'text-slate-900 dark:text-slate-50'}`}>
                      {notif.title}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-2 ${notif.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
                      {notif.content}
                    </p>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {timeString}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Không có thông báo nào</h3>
            <p className="text-sm font-medium text-slate-500 max-w-xs">
              Thư mục thông báo của bạn hiện đang trống.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
