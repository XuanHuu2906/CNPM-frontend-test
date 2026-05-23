import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Download,
  User,
  Laptop,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  ShieldX,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { adminService } from '../../services/adminService';
import type { SystemLog } from '../../services/academicService';

export default function SystemAuditTrail() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Bản đồ ánh xạ hành động nghiệp vụ thân thiện và mức độ mặc định
  const ACTION_MAP: Record<string, { label: string; level: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY'; style: string }> = {
    'SERVER_START': { label: 'Khởi động hệ thống', level: 'INFO', style: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 border' },
    'SEVER_START': { label: 'Khởi động hệ thống', level: 'INFO', style: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 border' },
    'ACADEMIC_ASSIGN': { label: 'Phân công giảng viên', level: 'INFO', style: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 border' },
    'DELETE': { label: 'Xóa dữ liệu', level: 'CRITICAL', style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 border' },
    'GRADE': { label: 'Thao tác điểm', level: 'INFO', style: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 border' },
    'LOGIN': { label: 'Đăng nhập', level: 'SECURITY', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 border' },
    'LOGOUT': { label: 'Đăng xuất', level: 'SECURITY', style: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 border' },
    'IMPORT': { label: 'Nhập dữ liệu', level: 'INFO', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 border' },
    'BACKUP': { label: 'Sao lưu', level: 'CRITICAL', style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 border' },
    'RESTORE': { label: 'Phục hồi', level: 'CRITICAL', style: 'bg-rose-100 text-rose-800 border-rose-250 dark:bg-rose-950/40 dark:text-rose-300 border animate-pulse' },
    'SUBMIT': { label: 'Nộp báo cáo', level: 'INFO', style: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 border' },
    'SYSTEM': { label: 'Hệ thống', level: 'INFO', style: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 border' },
  };

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getActionDetails = (action: string, description: string) => {
    const act = action.toUpperCase();
    const details = ACTION_MAP[act] || {
      label: action.replace(/_/g, ' '),
      level: 'INFO' as const,
      style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 border'
    };

    let level = details.level;
    const descLower = description?.toLowerCase() || '';
    if (descLower.includes('thất bại') || descLower.includes('bị từ chối') || descLower.includes('sai mật khẩu')) {
      level = 'WARNING';
    }

    return { ...details, level };
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(getLocalDateString(start));
    setEndDate(getLocalDateString(end));
  };

  // Tải danh sách nhật ký từ Postgres API
  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getLogs(currentPage, itemsPerPage);
      setLogs(response.logs);
      setTotalLogs(response.total);
    } catch (error: any) {
      toast.error(`Không thể kết nối lấy lịch sử nhật ký hệ thống: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage]);

  // Lọc cục bộ phía client dựa trên từ khóa search, thời gian, vai trò, mức độ, và hành động
  const filteredLogs = logs.filter(log => {
    const userFullName = log.user?.fullName || 'Hệ thống';
    const userEmail = log.user?.email || 'system';
    const details = log.description || '';
    const actUpper = log.action?.toUpperCase() || '';

    const matchesSearch =
      userFullName.toLowerCase().includes(search.toLowerCase()) ||
      userEmail.toLowerCase().includes(search.toLowerCase()) ||
      details.toLowerCase().includes(search.toLowerCase());

    // Sửa lỗi chính tả SEVER_START -> SERVER_START trong việc so khớp bộ lọc
    const normalizedLogAction = actUpper === 'SEVER_START' ? 'SERVER_START' : actUpper;
    const normalizedFilterAction = actionFilter === 'ALL' ? 'ALL' : (actionFilter === 'SEVER_START' ? 'SERVER_START' : actionFilter.toUpperCase());

    const matchesAction = normalizedFilterAction === 'ALL' || normalizedLogAction === normalizedFilterAction;

    // Thẩm định thành công/thất bại dựa trên chi tiết log
    const isFailed = details.toLowerCase().includes('thất bại') || details.toLowerCase().includes('bị từ chối') || details.toLowerCase().includes('sai mật khẩu');
    const status = isFailed ? 'FAILED' : 'SUCCESS';
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

    // Lọc theo khoảng thời gian
    const matchesDate = (() => {
      if (!startDate && !endDate) return true;
      const logDateStr = getLocalDateString(new Date(log.createdAt));

      if (startDate && logDateStr < startDate) return false;
      if (endDate && logDateStr > endDate) return false;
      return true;
    })();

    // Lọc theo vai trò của người dùng
    const matchesRole = (() => {
      if (roleFilter === 'ALL') return true;
      const role = log.user?.role?.toUpperCase();
      return role === roleFilter;
    })();

    // Lọc theo mức độ log
    const matchesLevel = (() => {
      if (levelFilter === 'ALL') return true;
      const logDetails = getActionDetails(log.action, log.description);
      return logDetails.level === levelFilter;
    })();

    return matchesSearch && matchesAction && matchesStatus && matchesDate && matchesRole && matchesLevel;
  });

  const handleExportCSV = () => {
    toast.success('Đang khởi tạo tệp tin CSV nhật ký...');
    setTimeout(() => {
      const headers = 'ID,Thời gian,Tài khoản,Vai trò,Hành động (Mã gốc),Hành động (Tiếng Việt),Mức độ,Kết quả,Chi tiết,Địa chỉ IP\n';
      const rows = filteredLogs.map(l => {
        const timeStr = new Date(l.createdAt).toLocaleString('vi-VN');
        const userStr = l.user ? `${l.user.fullName} (${l.user.email})` : 'Hệ thống';
        const roleStr = l.user ? l.user.role : 'SYSTEM';
        const details = getActionDetails(l.action, l.description);
        const isFailed = l.description?.toLowerCase().includes('thất bại') || l.description?.toLowerCase().includes('bị từ chối') || l.description?.toLowerCase().includes('sai mật khẩu');
        const statusStr = isFailed ? 'Thất bại' : 'Thành công';
        return `"${l.id}","${timeStr}","${userStr}","${roleStr}","${l.action}","${details.label}","${details.level}","${statusStr}","${l.description}","${l.ipAddress || 'localhost'}"`;
      }).join('\n');

      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_trail_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Tải xuống tệp CSV nhật ký thành công!');
    }, 1000);
  };

  const getLevelBadge = (level: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY') => {
    switch (level) {
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
            Thông tin
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 animate-pulse">
            Cảnh báo
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40">
            Nghiêm trọng
          </span>
        );
      case 'SECURITY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40">
            Bảo mật
          </span>
        );
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
          Hệ thống
        </span>
      );
    }
    const r = role.toUpperCase();
    switch (r) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30">
            Quản trị viên
          </span>
        );
      case 'TEACHER':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
            Giảng viên
          </span>
        );
      case 'STUDENT':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
            Sinh viên
          </span>
        );
      case 'ACADEMIC_DEPT':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
            Phòng Đào tạo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            {role}
          </span>
        );
    }
  };

  const getActionBadgeStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 border';
    }
    if (act.includes('SYSTEM') || act.includes('CONFIG')) {
      return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 border';
    }
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 border';
    }
    if (act.includes('GRADE') || act.includes('SCORE') || act.includes('APPROVE')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 border';
    }
    if (act.includes('SUBMIT') || act.includes('UPLOAD')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 border';
    }
    return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 border';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
            Nhật ký hoạt động hệ thống
          </h1>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950/40 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Xuất tệp CSV
        </Button>
      </div>

      {/* FILTER BAR */}
      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-2xl p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Tìm tên, email, chi tiết..."
                value={search}
                onChange={e => { setSearch(e.target.value); }}
                className="pl-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white dark:bg-slate-950 dark:border-slate-800"
              />
            </div>

            {/* Action filter dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet-500/20">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={actionFilter}
                onChange={e => { setActionFilter(e.target.value); }}
                className="w-full bg-transparent border-none text-sm focus:ring-0 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer outline-none"
              >
                <option value="ALL">Tất cả hành động</option>
                <option value="LOGIN">Đăng nhập (LOGIN)</option>
                <option value="GRADE">Chấm điểm (GRADE)</option>
                <option value="DELETE">Xóa (DELETE)</option>
                <option value="SUBMIT">Nộp báo cáo (SUBMIT)</option>
                <option value="SYSTEM">Hệ thống (SYSTEM)</option>
                <option value="BACKUP">Sao lưu (BACKUP)</option>
                <option value="RESTORE">Khôi phục (RESTORE)</option>
                <option value="SERVER_START">Khởi động hệ thống</option>
              </select>
            </div>

            {/* Role filter dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet-500/20">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); }}
                className="w-full bg-transparent border-none text-sm focus:ring-0 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer outline-none"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ADMIN">Quản trị viên</option>
                <option value="TEACHER">Giảng viên</option>
                <option value="STUDENT">Sinh viên</option>
                <option value="ACADEMIC_DEPT">Phòng Đào tạo</option>
              </select>
            </div>

            {/* Level filter dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet-500/20">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={levelFilter}
                onChange={e => { setLevelFilter(e.target.value); }}
                className="w-full bg-transparent border-none text-sm focus:ring-0 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer outline-none"
              >
                <option value="ALL">Tất cả mức độ</option>
                <option value="INFO">Thông tin (INFO)</option>
                <option value="WARNING">Cảnh báo (WARNING)</option>
                <option value="CRITICAL">Nghiêm trọng (CRITICAL)</option>
                <option value="SECURITY">Bảo mật (SECURITY)</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            {/* Start Date & End Date */}
            <div className="lg:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Từ ngày:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Đến ngày:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer"
                />
              </div>

              {/* Quick filter dates */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuickDateRange(0)}
                  className="rounded-lg text-[11px] font-bold h-8 px-2.5 border-slate-200 dark:border-slate-800 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  Hôm nay
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuickDateRange(7)}
                  className="rounded-lg text-[11px] font-bold h-8 px-2.5 border-slate-200 dark:border-slate-800 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  7 ngày qua
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuickDateRange(30)}
                  className="rounded-lg text-[11px] font-bold h-8 px-2.5 border-slate-200 dark:border-slate-800 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  30 ngày qua
                </Button>
              </div>
            </div>

            {/* Reset Filter Button */}
            <div className="flex items-center justify-end gap-2">
              {(search || actionFilter !== 'ALL' || statusFilter !== 'ALL' || roleFilter !== 'ALL' || levelFilter !== 'ALL' || startDate || endDate) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch('');
                    setActionFilter('ALL');
                    setStatusFilter('ALL');
                    setRoleFilter('ALL');
                    setLevelFilter('ALL');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold rounded-xl h-9"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* DATA TABLE */}
      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-xl rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin mb-3" />
              <p className="text-xs text-muted-foreground font-semibold">Đang nạp dữ liệu nhật ký bảo mật...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-150 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50">
                  <th className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Thời gian</th>
                  <th className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Tài khoản & IP</th>
                  <th className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Hành động</th>
                  <th className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Mức độ & Kết quả</th>
                  <th className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 w-2/5">Chi tiết thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isFailed = log.description?.toLowerCase().includes('thất bại') || log.description?.toLowerCase().includes('bị từ chối') || log.description?.toLowerCase().includes('sai mật khẩu');
                    const status = isFailed ? 'FAILED' : 'SUCCESS';
                    const userFullName = log.user?.fullName || 'Hệ thống';
                    const userEmail = log.user?.email || 'system';
                    const dateObj = new Date(log.createdAt);
                    const details = getActionDetails(log.action, log.description);

                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors ${status === 'FAILED' ? 'bg-amber-50/10 dark:bg-amber-950/5' : ''
                          } ${log.action.toUpperCase().includes('DELETE') ? 'bg-rose-500/[0.02] dark:bg-rose-950/5' : ''
                          }`}
                      >
                        {/* Time */}
                        <td className="py-4.5 px-6 whitespace-nowrap text-slate-500 dark:text-slate-400 font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {dateObj.toLocaleTimeString('vi-VN')}
                            </span>
                            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full">
                              {dateObj.toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </td>

                        {/* Account & IP */}
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${!log.user
                              ? 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'
                              : 'bg-violet-50 border-violet-100 text-violet-600 dark:bg-violet-950/30 dark:border-violet-900 dark:text-violet-400'
                              }`}>
                              {userFullName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 leading-tight">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {userFullName}
                                </span>
                                {getRoleBadge(log.user?.role)}
                              </div>
                              <div className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1.5">
                                <span>@{userEmail.split('@')[0]}</span>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="font-mono text-[10px] text-slate-400">IP: {log.ipAddress || '127.0.0.1'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${details.style}`}>
                              {details.label}
                            </span>
                            <code className="text-[10px] font-mono text-slate-400 block pl-0.5">
                              {log.action === 'SEVER_START' ? 'SERVER_START' : log.action}
                            </code>
                          </div>
                        </td>

                        {/* Level & Result */}
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                            {getLevelBadge(details.level)}
                            {status === 'SUCCESS' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                                <CheckCircle className="w-3 h-3 shrink-0" />
                                Thành công
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/10 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                Thất bại
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Details */}
                        <td className="py-4.5 px-6 text-slate-600 dark:text-slate-300 font-medium">
                          {log.description}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground font-medium">
                      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      Không tìm thấy bản ghi nhật ký phù hợp!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {totalLogs > itemsPerPage && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/10">
            <div className="text-xs text-slate-400 font-bold flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-slate-300" /> Hệ thống lưu trữ nhật ký tối đa trong vòng 90 ngày gần nhất.
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg px-2.5 h-9"
              >
                Trước
              </Button>
              {Array.from({ length: Math.ceil(totalLogs / itemsPerPage) }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 p-0 rounded-lg font-bold ${currentPage === i + 1 ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md' : ''
                    }`}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalLogs / itemsPerPage)))}
                disabled={currentPage === Math.ceil(totalLogs / itemsPerPage)}
                className="rounded-lg px-2.5 h-9"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}
