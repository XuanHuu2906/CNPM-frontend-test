import { useState, useEffect } from 'react';
import {
  Database,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldAlert,
  Loader2,
  Download,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { adminService, type BackupFile } from '../../services/adminService';

export default function DataBackupRestore() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isRestoreLoading, setIsRestoreLoading] = useState(false);

  const [justRestored, setJustRestored] = useState<{
    fileName: string;
    time: string;
  } | null>(null);

  const [restoreStats, setRestoreStats] = useState<{
    latestBackupAt: string | null;
    latestBackupStatus: string | null;
    latestRestoreAt: string | null;
    latestRestoredBackupId: string | null;
    latestRestoredBackupFile: string | null;
    latestRestoredBy: string | null;
    latestRestoreStatus: string | null;
  }>({
    latestBackupAt: null,
    latestBackupStatus: null,
    latestRestoreAt: null,
    latestRestoredBackupId: null,
    latestRestoredBackupFile: null,
    latestRestoredBy: null,
    latestRestoreStatus: null,
  });

  // Tải danh sách các file sao lưu từ API
  const loadBackups = async () => {
    setIsLoadingList(true);
    try {
      const res = await adminService.listBackups();
      setBackups(res.backups);
      setRestoreStats({
        latestBackupAt: res.latestBackupAt,
        latestBackupStatus: res.latestBackupStatus,
        latestRestoreAt: res.latestRestoreAt,
        latestRestoredBackupId: res.latestRestoredBackupId,
        latestRestoredBackupFile: res.latestRestoredBackupFile,
        latestRestoredBy: res.latestRestoredBy,
        latestRestoreStatus: res.latestRestoreStatus,
      });
    } catch (error: any) {
      toast.error(`Không thể kết nối lấy danh sách bản sao lưu: ${error.message}`);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  // Tạo sao lưu mới trực tiếp trên máy chủ
  const handleCreateBackup = async () => {
    setIsBackupLoading(true);
    toast.loading('Hệ thống đang tiến hành nén dữ liệu và tạo file SQL sao lưu...', { id: 'create-bkp' });

    try {
      await adminService.backupDb();
      toast.success('Khởi tạo điểm sao lưu cơ sở dữ liệu hệ thống thành công!', { id: 'create-bkp' });
      await loadBackups();
    } catch (error: any) {
      toast.error(`Khởi tạo điểm sao lưu thất bại: ${error.message}`, { id: 'create-bkp' });
    } finally {
      setIsBackupLoading(false);
    }
  };

  // Xóa tệp sao lưu khỏi ổ cứng máy chủ
  const handleDeleteBackup = async (fileName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tệp sao lưu "${fileName}" khỏi ổ cứng máy chủ?`)) {
      return;
    }

    try {
      toast.loading('Đang tiến hành gỡ bỏ file sao lưu...', { id: 'delete-bkp' });
      await adminService.deleteBackup(fileName);
      toast.success(`Đã xóa file sao lưu "${fileName}" thành công!`, { id: 'delete-bkp' });
      await loadBackups();
    } catch (error: any) {
      toast.error(`Xóa file sao lưu thất bại: ${error.message}`, { id: 'delete-bkp' });
    }
  };

  // Tải xuống file sao lưu về máy client
  const handleDownloadBackup = async (fileName: string) => {
    try {
      toast.loading('Đang chuẩn bị tải xuống file sao lưu...', { id: 'download-bkp' });
      const blob = await adminService.downloadBackup(fileName);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Đã tải xuống file sao lưu "${fileName}" thành công!`, { id: 'download-bkp' });
    } catch (error: any) {
      toast.error(`Tải xuống thất bại: ${error.message}`, { id: 'download-bkp' });
    }
  };

  // Hiển thị chi tiết tệp tin sao lưu
  const handleShowDetails = (backup: BackupFile) => {
    toast.info(
      <div className="text-left space-y-1.5 p-1">
        <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Chi tiết bản sao lưu</p>
        <p className="text-xs text-slate-600 dark:text-slate-300 font-mono break-all"><span className="font-semibold text-slate-500 dark:text-slate-400">Tên file:</span> {backup.fileName}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-500 dark:text-slate-400">Dung lượng:</span> {backup.fileSize}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-500 dark:text-slate-400">Loại:</span> {backup.type === 'manual' || backup.type === 'Thủ công' ? 'Thủ công (Manual)' : 'Tự động (Auto)'}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-500 dark:text-slate-400">Người tạo:</span> {backup.creator || 'Hệ thống'}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-500 dark:text-slate-400">Thời gian tạo:</span> {new Date(backup.createdAt).toLocaleString('vi-VN')}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-500 dark:text-slate-400">Định dạng file:</span> ZIP Archive (PostgreSQL DB + Uploads)</p>
      </div>,
      { duration: 6000 }
    );
  };

  const handleOpenRestore = (backup: BackupFile) => {
    setSelectedBackup(backup);
    setConfirmText('');
    setIsRestoreOpen(true);
  };

  // Khôi phục cơ sở dữ liệu về điểm chỉ định
  const handleConfirmRestore = async () => {
    if (!selectedBackup) return;
    if (confirmText !== 'XAC NHAN KHOI PHUC') {
      toast.error('Mã xác nhận không chính xác! Vui lòng nhập "XAC NHAN KHOI PHUC" để xác thực.');
      return;
    }

    setIsRestoreLoading(true);
    toast.warning('Bắt đầu quá trình ghi đè và phục hồi cơ sở dữ liệu...', { id: 'restore-bkp' });

    try {
      await adminService.restoreDb(selectedBackup.fileName);
      const nowTime = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
      setJustRestored({
        fileName: selectedBackup.fileName,
        time: nowTime
      });
      toast.success('Phục hồi dữ liệu hệ thống hoàn tất! Toàn bộ bảng đã quay về điểm chỉ định.', { id: 'restore-bkp' });
      setIsRestoreOpen(false);
      setSelectedBackup(null);
      setConfirmText('');
      await loadBackups();
    } catch (error: any) {
      toast.error(`Khôi phục cơ sở dữ liệu thất bại: ${error.message}`, { id: 'restore-bkp' });
    } finally {
      setIsRestoreLoading(false);
    }
  };

  // Tính tổng dung lượng sao lưu từ danh sách thực tế
  const calculateTotalSize = () => {
    let totalMb = 0;
    backups.forEach(b => {
      const sizeStr = b.fileSize.toUpperCase();
      if (sizeStr.includes('MB')) {
        totalMb += parseFloat(sizeStr);
      } else if (sizeStr.includes('KB')) {
        totalMb += parseFloat(sizeStr) / 1024;
      } else if (sizeStr.includes('GB')) {
        totalMb += parseFloat(sizeStr) * 1024;
      } else {
        const bytes = parseFloat(sizeStr);
        if (!isNaN(bytes)) {
          totalMb += bytes / (1024 * 1024);
        }
      }
    });
    return totalMb.toFixed(2);
  };

  const getLatestBackupTime = () => {
    if (backups.length === 0) return 'Chưa có';
    return new Date(backups[0].createdAt).toLocaleString('vi-VN');
  };

  const getLatestBackupStatus = () => {
    if (backups.length === 0) return 'Chưa có';
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
        Thành công
      </span>
    );
  };

  const getLatestRestoreTime = () => {
    if (!restoreStats.latestRestoreAt) return 'Chưa có';
    return new Date(restoreStats.latestRestoreAt).toLocaleTimeString('vi-VN') + ' ' + new Date(restoreStats.latestRestoreAt).toLocaleDateString('vi-VN');
  };

  const getLatestRestoreFile = () => {
    return restoreStats.latestRestoredBackupFile || '—';
  };

  const getLatestRestoredBy = () => {
    return restoreStats.latestRestoredBy || '—';
  };

  const getLatestRestoreStatus = () => {
    if (!restoreStats.latestRestoreStatus) return '—';
    if (restoreStats.latestRestoreStatus === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
          Thành công
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
        Thất bại
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
            Sao lưu & Khôi phục dữ liệu
          </h1>
        </div>
        <Button
          onClick={handleCreateBackup}
          disabled={isBackupLoading}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-5 py-6 shadow-lg shadow-violet-500/25 flex items-center gap-2 self-start md:self-auto transition-all active:scale-95 shrink-0"
        >
          {isBackupLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          Tạo bản sao lưu ngay
        </Button>
      </div>

      {/* WARNING NOTIFICATION */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 rounded-2xl font-semibold flex items-start gap-4 shadow-sm text-left">
        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold leading-tight">Cảnh báo rủi ro thao tác dữ liệu!</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Hành động khôi phục dữ liệu (Restore) sẽ ghi đè hoàn toàn cơ sở dữ liệu hiện tại về điểm sao lưu. Mọi thay đổi phát sinh sau thời điểm sao lưu đã chọn sẽ bị xóa vĩnh viễn. Chỉ thực hiện khi có yêu cầu khẩn cấp.
          </p>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {justRestored && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-400 rounded-2xl font-semibold flex items-start justify-between gap-4 shadow-sm text-left animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-1 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 mt-0.5">
              <RotateCcw className="w-5 h-5 shrink-0" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold leading-tight">Khôi phục dữ liệu thành công!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Hệ thống đã được khôi phục thành công từ bản sao lưu <span className="font-mono font-bold text-slate-700 dark:text-slate-350">{justRestored.fileName}</span> lúc <span className="font-bold text-slate-700 dark:text-slate-350">{justRestored.time}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setJustRestored(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            title="Đóng thông báo"
          >
            <span className="text-lg font-bold">×</span>
          </button>
        </div>
      )}

      {/* DATA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: BACKUP OVERVIEW */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-2xl">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Thông số Sao lưu
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 space-y-4">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500">Chu kỳ Tự động:</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Hàng ngày (00:00)</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500">Thời gian lưu trữ tối đa:</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">30 ngày gần nhất</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500">Tổng dung lượng sao lưu:</span>
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{calculateTotalSize()} MB</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500">Số bản sao lưu:</span>
                <span className="text-sm font-bold text-slate-755 dark:text-slate-350">{backups.length} bản</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500 font-medium">Lần sao lưu gần nhất:</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{getLatestBackupTime()}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500 font-medium">Trạng thái sao lưu gần nhất:</span>
                {getLatestBackupStatus()}
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500 font-medium">Lần khôi phục gần nhất:</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{getLatestRestoreTime()}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500 font-medium">Khôi phục từ bản sao lưu:</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono truncate max-w-[150px]" title={getLatestRestoreFile()}>{getLatestRestoreFile()}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500 font-medium">Người khôi phục:</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{getLatestRestoredBy()}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm font-semibold text-slate-500 font-medium">Trạng thái khôi phục:</span>
                {getLatestRestoreStatus()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: LIST OF FILES */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Danh sách các bản sao lưu đã tạo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingList ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin mb-3" />
                  <p className="text-xs text-muted-foreground font-semibold">Đang truy vấn lịch sử sao lưu...</p>
                </div>
              ) : backups.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <Database className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-xs text-muted-foreground font-semibold">Chưa có tệp tin sao lưu nào trong thư mục.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-150 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50">
                        <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Thời gian tạo</th>
                        <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Tên file / mã bản sao lưu</th>
                        <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Loại sao lưu</th>
                        <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Dung lượng</th>
                        <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Người tạo</th>
                        <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                        <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {backups.map((backup) => (
                        <tr key={backup.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-all">
                          {/* Created Time */}
                          <td className="py-4 px-5 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono">{new Date(backup.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                          </td>

                          {/* Filename */}
                          <td className="py-4 px-5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="flex items-center gap-2.5">
                                <Database className="w-4 h-4 text-violet-500 shrink-0" />
                                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight block truncate max-w-[200px]" title={backup.fileName}>
                                  {backup.fileName}
                                </span>
                              </div>
                              {restoreStats.latestRestoredBackupFile === backup.fileName && restoreStats.latestRestoreStatus === 'SUCCESS' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800 animate-pulse shrink-0 self-start sm:self-auto">
                                  Khôi phục gần nhất
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-4 px-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${backup.type === 'manual' || backup.type === 'Thủ công'
                              ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400'
                              : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                              {backup.type === 'manual' ? 'Thủ công' : backup.type === 'auto' ? 'Tự động' : backup.type}
                            </span>
                          </td>

                          {/* Size */}
                          <td className="py-4 px-5 text-slate-600 dark:text-slate-400 font-mono text-xs font-bold">
                            {backup.fileSize}
                          </td>

                          {/* Creator */}
                          <td className="py-4 px-5 text-xs font-bold text-slate-600 dark:text-slate-400">
                            {backup.creator || 'Hệ thống'}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                              Thành công
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <Button
                                onClick={() => handleShowDetails(backup)}
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 h-8 px-2"
                                title="Xem chi tiết bản sao lưu"
                              >
                                <Info className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline ml-1">Chi tiết</span>
                              </Button>

                              {/* Download Button */}
                              <Button
                                onClick={() => handleDownloadBackup(backup.fileName)}
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-blue-950/10 h-8 px-2"
                                title="Tải xuống tệp tin sao lưu"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline ml-1">Tải xuống</span>
                              </Button>

                              {/* Restore Button */}
                              <Button
                                onClick={() => handleOpenRestore(backup)}
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-amber-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:hover:bg-amber-950/10 h-8 px-2"
                                title="Khôi phục điểm dữ liệu này"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline ml-1">Khôi phục</span>
                              </Button>

                              {/* Delete Button */}
                              <Button
                                onClick={() => handleDeleteBackup(backup.fileName)}
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-950/20 w-8 h-8 p-0"
                                title="Xóa tệp tin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* HIGH RISK RESTORE DIALOG */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" /> Cảnh báo Khôi phục Cơ sở dữ liệu
            </DialogTitle>
            <DialogDescription className="font-semibold text-slate-400 text-xs">
              Thao tác này sẽ đặt lại hệ thống về trạng thái sao lưu trước đó. Mọi tiến độ hiện tại sẽ bị xóa hoàn toàn.
            </DialogDescription>
          </DialogHeader>

          {isRestoreLoading ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-10 h-10 text-rose-600 dark:text-rose-400 animate-spin mb-4" />
              <h4 className="font-bold text-base text-rose-600 dark:text-rose-400">Đang khôi phục dữ liệu...</h4>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Hệ thống đang phục hồi cấu trúc và ghi lại lịch sử giao dịch SQL.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4 text-left">
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Cảnh báo:</span>
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 leading-relaxed">
                  Khôi phục dữ liệu sẽ ghi đè dữ liệu hiện tại bằng bản sao lưu đã chọn. Các thay đổi sau thời điểm sao lưu có thể bị mất.
                </p>
                <div className="border-t border-rose-250/20 my-2 pt-2">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Điểm khôi phục chỉ định:</span>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight break-all">
                    {selectedBackup?.fileName}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Tạo bởi: {selectedBackup?.creator || 'Hệ thống'} vào lúc {selectedBackup ? new Date(selectedBackup.createdAt).toLocaleString('vi-VN') : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-restore-text" className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  Xác nhận hành vi rủi ro cao *
                </Label>
                <p className="text-[11px] text-slate-500 font-semibold mb-2">
                  Vui lòng gõ chính xác cụm từ <code className="font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">XAC NHAN KHOI PHUC</code> để mở khóa chức năng:
                </p>
                <Input
                  id="confirm-restore-text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="Gõ XAC NHAN KHOI PHUC tại đây"
                  className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 font-bold border-rose-200 focus:ring-rose-500/20 focus:border-rose-500"
                  required
                />
              </div>
            </div>
          )}

          {!isRestoreLoading && (
            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRestoreOpen(false)}
                className="rounded-xl font-bold"
              >
                Hủy bỏ
              </Button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={confirmText !== 'XAC NHAN KHOI PHUC'}
                className={`inline-flex items-center justify-center rounded-xl text-sm font-bold px-4 h-8 transition-all duration-200 outline-none select-none active:scale-[0.98] shadow-md ${confirmText === 'XAC NHAN KHOI PHUC'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10 hover:shadow-rose-600/20 cursor-pointer'
                  : 'bg-slate-100 text-slate-450 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed opacity-60'
                  }`}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Xác nhận khôi phục
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
