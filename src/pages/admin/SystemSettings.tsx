import { useState, useEffect } from 'react';
import {
  Sliders,
  FileCheck,
  Percent,
  ShieldCheck,
  Save,
  Loader2,
  Info,
  Check,
  AlertCircle,
  Lock,
  Unlock,
  Mail,
  Layers,
  Settings,
  AlertOctagon,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { adminService } from '../../services/adminService';
import { academicService } from '../../services/academicService';

// Type Definitions
interface ExtensionOption {
  ext: string;
  allowed: boolean;
  label: string;
}

interface SemesterLockState {
  id: string;
  name: string;
  academicYear: string;
  approvedClassesCount: number;
  totalClassesCount: number;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'grading' | 'notifications' | 'lock'>('general');
  const [isSaving, setIsSaving] = useState(false);

  // TAB 1: Cấu hình Tệp tin & Trình lặp nội dung (UC-14)
  const [maxMainReportSizeMB, setMaxMainReportSizeMB] = useState<number>(50);
  const [maxAttachmentSizeMB, setMaxAttachmentSizeMB] = useState<number>(100);
  const [maxTotalUploadSizeMB, setMaxTotalUploadSizeMB] = useState<number>(250);
  const [maxAttachmentFiles, setMaxAttachmentFiles] = useState<number>(5);

  const [mainExtensions, setMainExtensions] = useState<ExtensionOption[]>([
    { ext: '.pdf', allowed: true, label: 'Tài liệu PDF (.pdf)' },
    { ext: '.docx', allowed: true, label: 'Microsoft Word (.docx)' },
    { ext: '.pptx', allowed: false, label: 'Microsoft PowerPoint (.pptx)' }
  ]);

  const [attachmentExtensions, setAttachmentExtensions] = useState<ExtensionOption[]>([
    { ext: '.zip', allowed: true, label: 'Tệp nén ZIP (.zip)' },
    { ext: '.rar', allowed: false, label: 'Tệp nén RAR (.rar)' },
    { ext: '.xlsx', allowed: false, label: 'Microsoft Excel (.xlsx)' },
    { ext: '.png', allowed: false, label: 'Hình ảnh PNG (.png)' },
    { ext: '.jpg', allowed: false, label: 'Hình ảnh JPG (.jpg)' }
  ]);

  const [similarityWarningThreshold, setSimilarityWarningThreshold] = useState<number>(20);
  const [autoFinalLockEnabled, setAutoFinalLockEnabled] = useState<boolean>(true);

  // ==========================================
  // TAB 2: Bảo mật & Phiên làm việc
  // ==========================================
  const [sessionTimeout, setSessionTimeout] = useState<number>(30); // minutes
  const [maxLoginAttempts, setMaxLoginAttempts] = useState<number>(5);
  const [requireTwoFactor, setRequireTwoFactor] = useState<boolean>(false);

  // ==========================================
  // TAB 3: Thang điểm & Quy chế (UC-14 - MỚI)
  // ==========================================
  const [gradingScale, setGradingScale] = useState<'SCALE_10' | 'SCALE_4' | 'SCALE_LETTER'>('SCALE_10');
  const [decimalRounding, setDecimalRounding] = useState<'ROUND_HALF_UP' | 'ROUND_DOWN' | 'ROUND_UP'>('ROUND_HALF_UP');
  const [minPassScore, setMinPassScore] = useState<number>(5.0);

  // ==========================================
  // TAB 4: Mẫu thông báo & Kênh (UC-14 - MỚI)
  // ==========================================
  const [enableEmailNotification, setEnableEmailNotification] = useState<boolean>(true);
  const [enableInAppNotification, setEnableInAppNotification] = useState<boolean>(true);
  const [emailTemplateSubmission, setEmailTemplateSubmission] = useState<string>(
    'Chào [STUDENT_NAME],\n\nBáo cáo đề tài "[TOPIC_NAME]" của nhóm bạn đã được nộp thành công lên hệ thống EduGrade Pro vào lúc [TIME].\n\nTrân trọng,\nBan quản trị.'
  );
  const [emailTemplateViolation, setEmailTemplateViolation] = useState<string>(
    'Báo cáo đề tài "[TOPIC_NAME]" của bạn đã bị từ chối do vi phạm quy chế: [REASON]. Vui lòng liên hệ giảng viên phụ trách hoặc bộ phận liên quan để được hướng dẫn xử lý.'
  );

  // ==========================================
  // TAB 5: Khóa điểm Học kỳ (UC-19 - MỚI)
  // ==========================================
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemesterToLock, setSelectedSemesterToLock] = useState<string>('');
  const [selectedSemesterStats, setSelectedSemesterStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [securityConfirmText, setSecurityConfirmText] = useState<string>('');
  const [isLockingInProgress, setIsLockingInProgress] = useState<boolean>(false);

  // Load configs and academic semesters from Backend DB on mount
  const loadSettingsData = async () => {
    try {
      const configItems = await adminService.getConfigs();
      configItems.forEach(c => {
        const k = c.key.toUpperCase();
        const v = c.value;
        if (k === 'MAX_FILE_SIZE') setMaxMainReportSizeMB(Number(v));
        if (k === 'MAX_MAIN_REPORT_SIZE_MB') setMaxMainReportSizeMB(Number(v));
        if (k === 'MAX_ATTACHMENT_SIZE_MB') setMaxAttachmentSizeMB(Number(v));
        if (k === 'MAX_TOTAL_UPLOAD_SIZE_MB') setMaxTotalUploadSizeMB(Number(v));
        if (k === 'MAX_ATTACHMENT_FILES') setMaxAttachmentFiles(Number(v));

        if (k === 'ALLOWED_MAIN_REPORT_EXTENSIONS') {
          const allowedExts = v.split(',').map(ext => ext.trim().toLowerCase());
          setMainExtensions(prev => prev.map(item => ({
            ...item,
            allowed: allowedExts.includes(item.ext.toLowerCase())
          })));
        }
        if (k === 'ALLOWED_ATTACHMENT_EXTENSIONS') {
          const allowedExts = v.split(',').map(ext => ext.trim().toLowerCase());
          setAttachmentExtensions(prev => prev.map(item => ({
            ...item,
            allowed: allowedExts.includes(item.ext.toLowerCase())
          })));
        }

        if (k === 'PLAGIARISM_THRESHOLD' || k === 'SIMILARITY_WARNING_THRESHOLD') {
          setSimilarityWarningThreshold(Number(v));
        }
        if (k === 'AUTO_GRADING_LOCK' || k === 'AUTO_FINAL_LOCK_ENABLED') {
          setAutoFinalLockEnabled(v === 'true');
        }

        if (k === 'GRADING_SCALE') setGradingScale(v as any);
        if (k === 'DECIMAL_ROUNDING') setDecimalRounding(v as any);
        if (k === 'MIN_PASS_SCORE') setMinPassScore(Number(v));
        if (k === 'SESSION_TIMEOUT') setSessionTimeout(Number(v));
        if (k === 'MAX_LOGIN_ATTEMPTS') setMaxLoginAttempts(Number(v));
        if (k === 'REQUIRE_TWO_FACTOR') setRequireTwoFactor(v === 'true');
        if (k === 'ENABLE_EMAIL_NOTIFICATION') setEnableEmailNotification(v === 'true');
        if (k === 'EMAIL_TEMPLATE_SUBMISSION') setEmailTemplateSubmission(v);
        if (k === 'EMAIL_TEMPLATE_VIOLATION') setEmailTemplateViolation(v);
      });

      // Fetch semesters (academic terms)
      const terms = await academicService.getAllTerms();
      const mapped = await Promise.all(terms.map(async t => {
        try {
          const stats = await adminService.getSemesterLockStats(t.id);
          return {
            id: t.id,
            name: t.name,
            academicYear: t.name.includes('-') ? t.name.split('-').slice(1).join('-') : '2025-2026',
            approvedClassesCount: stats.approvedReports,
            totalClassesCount: stats.totalReports,
            isLocked: stats.isLocked,
            lockedAt: stats.lockedAt ? new Date(stats.lockedAt).toLocaleString('vi-VN') : undefined,
            lockedBy: stats.lockedBy || 'Hệ thống (PĐT)'
          };
        } catch (e) {
          return {
            id: t.id,
            name: t.name,
            academicYear: '2025-2026',
            approvedClassesCount: t.isLocked ? 1 : 0,
            totalClassesCount: t.isLocked ? 1 : 0,
            isLocked: t.isLocked,
            lockedAt: t.isLocked ? new Date().toLocaleString('vi-VN') : undefined,
            lockedBy: t.isLocked ? 'Hệ thống (PĐT)' : undefined
          };
        }
      }));
      setSemesters(mapped);
    } catch (error: any) {
      toast.error(`Nạp cấu hình thất bại: ${error.message}`);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  // Fetch selected semester statistics on change
  useEffect(() => {
    if (!selectedSemesterToLock) {
      setSelectedSemesterStats(null);
      return;
    }
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const stats = await adminService.getSemesterLockStats(selectedSemesterToLock);
        setSelectedSemesterStats(stats);
      } catch (err: any) {
        toast.error(`Không thể lấy thống kê học kỳ: ${err.message}`);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, [selectedSemesterToLock]);

  // Handlers
  const toggleMainExtension = (ext: string) => {
    setMainExtensions(prev => prev.map(e => {
      if (e.ext === ext) return { ...e, allowed: !e.allowed };
      return e;
    }));
  };

  const toggleAttachmentExtension = (ext: string) => {
    setAttachmentExtensions(prev => prev.map(e => {
      if (e.ext === ext) return { ...e, allowed: !e.allowed };
      return e;
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (maxMainReportSizeMB <= 0 || maxMainReportSizeMB > 500) {
      toast.error('Dung lượng báo cáo chính phải nằm trong khoảng từ 1MB đến 500MB!');
      return;
    }
    if (maxAttachmentSizeMB <= 0 || maxAttachmentSizeMB > 1000) {
      toast.error('Dung lượng tệp đính kèm phải nằm trong khoảng từ 1MB đến 1000MB!');
      return;
    }
    if (maxTotalUploadSizeMB <= 0 || maxTotalUploadSizeMB > 2000) {
      toast.error('Tổng dung lượng tải lên phải nằm trong khoảng từ 1MB đến 2000MB!');
      return;
    }
    if (maxAttachmentFiles <= 0 || maxAttachmentFiles > 20) {
      toast.error('Số lượng tệp đính kèm tối đa phải nằm trong khoảng từ 1 đến 20!');
      return;
    }
    if (similarityWarningThreshold < 0 || similarityWarningThreshold > 100) {
      toast.error('Ngưỡng trùng lặp cảnh báo phải nằm trong khoảng từ 0% đến 100%!');
      return;
    }
    if (sessionTimeout <= 0 || sessionTimeout > 1440) {
      toast.error('Thời hạn phiên làm việc phải lớn hơn 0 và không quá 1440 phút (24 giờ)!');
      return;
    }
    if (maxLoginAttempts <= 0 || maxLoginAttempts > 15) {
      toast.error('Số lần đăng nhập sai tối đa phải lớn hơn 0 và tối đa 15 lần!');
      return;
    }
    if (gradingScale === 'SCALE_10' && (minPassScore < 0 || minPassScore > 10)) {
      toast.error('Điểm đạt tối thiểu phải nằm trong khoảng từ 0 đến 10 đối với Thang điểm 10!');
      return;
    }
    if (gradingScale === 'SCALE_4' && (minPassScore < 0 || minPassScore > 4)) {
      toast.error('Điểm đạt tối thiểu phải nằm trong khoảng từ 0 đến 4 đối với Thang điểm 4!');
      return;
    }
    if (gradingScale === 'SCALE_LETTER' && (minPassScore < 0 || minPassScore > 10)) {
      toast.error('Điểm đạt tối thiểu phải nằm trong khoảng từ 0 đến 10 đối với Thang điểm chữ!');
      return;
    }

    const allowedMain = mainExtensions.filter(e => e.allowed).map(e => e.ext);
    const allowedAttach = attachmentExtensions.filter(e => e.allowed).map(e => e.ext);

    if (allowedMain.length === 0) {
      toast.error('Vui lòng chọn ít nhất một định dạng hợp lệ cho báo cáo chính!');
      return;
    }
    if (allowedAttach.length === 0) {
      toast.error('Vui lòng chọn ít nhất một định dạng hợp lệ cho file đính kèm!');
      return;
    }

    setIsSaving(true);
    toast.loading('Đang đồng bộ và áp dụng cấu hình tham số mới...', { id: 'save-pref' });

    try {
      const updates = [
        { key: 'MAX_MAIN_REPORT_SIZE_MB', value: String(maxMainReportSizeMB) },
        { key: 'MAX_ATTACHMENT_SIZE_MB', value: String(maxAttachmentSizeMB) },
        { key: 'MAX_TOTAL_UPLOAD_SIZE_MB', value: String(maxTotalUploadSizeMB) },
        { key: 'MAX_ATTACHMENT_FILES', value: String(maxAttachmentFiles) },
        { key: 'ALLOWED_MAIN_REPORT_EXTENSIONS', value: allowedMain.join(',') },
        { key: 'ALLOWED_ATTACHMENT_EXTENSIONS', value: allowedAttach.join(',') },
        { key: 'SIMILARITY_WARNING_THRESHOLD', value: String(similarityWarningThreshold) },
        { key: 'AUTO_FINAL_LOCK_ENABLED', value: String(autoFinalLockEnabled) },

        { key: 'MAX_FILE_SIZE', value: String(maxMainReportSizeMB) },
        { key: 'PLAGIARISM_THRESHOLD', value: String(similarityWarningThreshold) },
        { key: 'AUTO_GRADING_LOCK', value: String(autoFinalLockEnabled) },

        { key: 'GRADING_SCALE', value: String(gradingScale) },
        { key: 'DECIMAL_ROUNDING', value: String(decimalRounding) },
        { key: 'MIN_PASS_SCORE', value: String(minPassScore) },
        { key: 'SESSION_TIMEOUT', value: String(sessionTimeout) },
        { key: 'MAX_LOGIN_ATTEMPTS', value: String(maxLoginAttempts) },
        { key: 'REQUIRE_TWO_FACTOR', value: String(requireTwoFactor) },
        { key: 'ENABLE_EMAIL_NOTIFICATION', value: String(enableEmailNotification) },
        { key: 'EMAIL_TEMPLATE_SUBMISSION', value: emailTemplateSubmission },
        { key: 'EMAIL_TEMPLATE_VIOLATION', value: emailTemplateViolation },
      ];

      for (const upd of updates) {
        await adminService.updateConfig(upd.key, upd.value);
      }

      toast.success('Đã lưu và đồng bộ thành công tất cả cấu hình tham số hệ thống!', { id: 'save-pref' });
    } catch (err: any) {
      toast.error(`Lưu cấu hình thất bại: ${err.message}`, { id: 'save-pref' });
    } finally {
      setIsSaving(false);
    }
  };

  // Thực hiện khóa điểm học kỳ (UC-19)
  const handleLockSemesterResults = async (e: React.FormEvent) => {
    e.preventDefault();
    const semester = semesters.find(s => s.id === selectedSemesterToLock);
    if (!semester) {
      toast.error('Vui lòng chọn học kỳ cần khóa điểm!');
      return;
    }

    if (semester.isLocked) {
      toast.error('Học kỳ này đã được khóa từ trước!');
      return;
    }

    if (!selectedSemesterStats) {
      toast.error('Không có thông tin thống kê học kỳ!');
      return;
    }

    const isApprovedAll = selectedSemesterStats.approvedReports === selectedSemesterStats.totalReports && selectedSemesterStats.totalReports > 0;
    if (!isApprovedAll) {
      toast.error(`Học kỳ này chưa hoàn thành phê duyệt tất cả các báo cáo (${selectedSemesterStats.approvedReports}/${selectedSemesterStats.totalReports}).`);
      return;
    }

    if (securityConfirmText !== "XAC NHAN KHOA DIEM") {
      toast.error(`Mã xác nhận không khớp! Vui lòng nhập chính xác: "XAC NHAN KHOA DIEM"`);
      return;
    }

    setIsLockingInProgress(true);
    toast.loading(`Hệ thống đang tiến hành niêm phong đóng băng kết quả học kỳ ${semester.name}...`, { id: 'lock-sem' });

    try {
      await adminService.lockSemester(semester.id);

      setSemesters(prev => prev.map(s => {
        if (s.id === semester.id) {
          return {
            ...s,
            isLocked: true,
            lockedAt: new Date().toLocaleString('vi-VN'),
            lockedBy: 'Trần Văn Quản Trị'
          };
        }
        return s;
      }));

      setIsLockingInProgress(false);
      setSelectedSemesterToLock('');
      setSecurityConfirmText('');
      setSelectedSemesterStats(null);
      toast.success(`ĐÃ KHÓA THÀNH CÔNG toàn bộ kết quả của học kỳ ${semester.name}! Mọi quyền chỉnh sửa điểm của Giảng viên đã bị đóng băng vĩnh viễn!`, { id: 'lock-sem' });
    } catch (error: any) {
      toast.error(`Khóa điểm thất bại: ${error.message}`, { id: 'lock-sem' });
      setIsLockingInProgress(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
            Cấu hình hệ thống & Khóa điểm
          </h1>
        </div>
      </div>

      {/* TABS CONTROLS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px font-sans">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all active:scale-95 ${activeTab === 'general'
            ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400 font-extrabold'
            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
        >
          <FileCheck className="w-4.5 h-4.5" /> Tệp tin & Trùng lặp nội dung
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all active:scale-95 ${activeTab === 'security'
            ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400 font-extrabold'
            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
        >
          <ShieldCheck className="w-4.5 h-4.5" /> Quy tắc Bảo mật
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all active:scale-95 ${activeTab === 'grading'
            ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400 font-extrabold'
            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
        >
          <Layers className="w-4.5 h-4.5" /> Thang điểm & Quy chế
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all active:scale-95 ${activeTab === 'notifications'
            ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400 font-extrabold'
            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
        >
          <Mail className="w-4.5 h-4.5" /> Mẫu Thông báo
        </button>
        <button
          onClick={() => setActiveTab('lock')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all active:scale-95 ${activeTab === 'lock'
            ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400 font-extrabold'
            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
        >
          <Lock className="w-4.5 h-4.5" /> Khóa điểm Cuối kỳ
        </button>
      </div>

      {/* FORM WRAPPER FOR PREFERENCE SETTINGS */}
      {activeTab !== 'lock' ? (
        <form onSubmit={handleSaveSettings} className="space-y-6">

          {/* TAB 1: FILE & PLAGIARISM */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-300">

              {/* File constraints */}
              <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-850">
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-violet-500" />
                    Cấu hình tệp tin & Định dạng tải lên
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">

                  {/* Grid for limits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-main-report-size" className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                        Dung lượng báo cáo chính tối đa (MB) *
                      </Label>
                      <div className="relative">
                        <Input
                          id="max-main-report-size"
                          type="number"
                          value={maxMainReportSizeMB}
                          onChange={e => setMaxMainReportSizeMB(Number(e.target.value))}
                          className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 font-bold pr-12 text-xs"
                          min={1}
                          max={500}
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">MB</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-attachment-size" className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                        Dung lượng file đính kèm tối đa (MB) *
                      </Label>
                      <div className="relative">
                        <Input
                          id="max-attachment-size"
                          type="number"
                          value={maxAttachmentSizeMB}
                          onChange={e => setMaxAttachmentSizeMB(Number(e.target.value))}
                          className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 font-bold pr-12 text-xs"
                          min={1}
                          max={1000}
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">MB</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-total-upload-size" className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                        Tổng dung lượng upload tối đa (MB) *
                      </Label>
                      <div className="relative">
                        <Input
                          id="max-total-upload-size"
                          type="number"
                          value={maxTotalUploadSizeMB}
                          onChange={e => setMaxTotalUploadSizeMB(Number(e.target.value))}
                          className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 font-bold pr-12 text-xs"
                          min={1}
                          max={2000}
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">MB</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-attachment-files" className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                        Số lượng file đính kèm tối đa *
                      </Label>
                      <div className="relative">
                        <Input
                          id="max-attachment-files"
                          type="number"
                          value={maxAttachmentFiles}
                          onChange={e => setMaxAttachmentFiles(Number(e.target.value))}
                          className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 font-bold pr-12 text-xs"
                          min={1}
                          max={20}
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">File</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

                  {/* Split checklist columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Group A: Main Reports */}
                    <div className="space-y-3">
                      <Label className="text-xs font-extrabold text-slate-705 dark:text-slate-200 block">
                        Định dạng báo cáo chính
                      </Label>
                      <div className="space-y-2">
                        {mainExtensions.map(item => (
                          <button
                            key={item.ext}
                            type="button"
                            onClick={() => toggleMainExtension(item.ext)}
                            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${item.allowed
                              ? 'bg-violet-50/50 border-violet-200 text-violet-700 dark:bg-violet-950/20 dark:border-violet-900/60 dark:text-violet-400'
                              : 'bg-slate-50 border-slate-200/80 text-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-600'
                              }`}
                          >
                            <div>
                              <div className="font-bold text-xs">{item.label}</div>
                              <div className="font-mono text-[10px] font-bold mt-0.5 opacity-85">{item.ext}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${item.allowed
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : 'border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-800'
                              }`}>
                              {item.allowed && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Group B: Attachments */}
                    <div className="space-y-3">
                      <Label className="text-xs font-extrabold text-slate-705 dark:text-slate-200 block">
                        Định dạng file đính kèm / minh chứng
                      </Label>
                      <div className="space-y-2">
                        {attachmentExtensions.map(item => (
                          <button
                            key={item.ext}
                            type="button"
                            onClick={() => toggleAttachmentExtension(item.ext)}
                            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${item.allowed
                              ? 'bg-violet-50/50 border-violet-200 text-violet-700 dark:bg-violet-950/20 dark:border-violet-900/60 dark:text-violet-400'
                              : 'bg-slate-50 border-slate-200/80 text-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-600'
                              }`}
                          >
                            <div>
                              <div className="font-bold text-xs">{item.label}</div>
                              <div className="font-mono text-[10px] font-bold mt-0.5 opacity-85">{item.ext}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${item.allowed
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : 'border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-800'
                              }`}>
                              {item.allowed && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Plagiarism Constraints */}
              <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-850">
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <Percent className="w-5 h-5 text-violet-500" />
                    Cảnh báo mức độ tương đồng & trùng lặp nội dung
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="similarity-threshold" className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                      Ngưỡng trùng lặp cảnh báo (%) *
                    </Label>
                    <div className="relative max-w-xs">
                      <Input
                        id="similarity-threshold"
                        type="number"
                        value={similarityWarningThreshold}
                        onChange={e => setSimilarityWarningThreshold(Number(e.target.value))}
                        className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 font-bold pr-12 text-xs"
                        min={0}
                        max={100}
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: SYSTEM SECURITY */}
          {activeTab === 'security' && (
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden max-w-2xl">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-850">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-violet-500" />
                  Cấu hình Quy tắc Bảo mật hệ thống
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">

                <div className="space-y-2">
                  <Label htmlFor="session-timeout" className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                    Thời hạn hiệu lực của phiên làm việc (Phút) *
                  </Label>
                  <div className="relative max-w-xs">
                    <Input
                      id="session-timeout"
                      type="number"
                      value={sessionTimeout}
                      onChange={e => setSessionTimeout(Number(e.target.value))}
                      className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 font-bold pr-16 text-xs"
                      min={5}
                      max={1440}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Phút</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">Người dùng sẽ tự động đăng xuất ra khỏi hệ thống nếu không phát sinh hoạt động tương tác trong khoảng thời gian này.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts" className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                    Số lần đăng nhập sai mật khẩu tối đa trước khi khóa tài khoản *
                  </Label>
                  <div className="relative max-w-xs">
                    <Input
                      id="max-login-attempts"
                      type="number"
                      value={maxLoginAttempts}
                      onChange={e => setMaxLoginAttempts(Number(e.target.value))}
                      className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 font-bold pr-12 text-xs"
                      min={3}
                      max={15}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Lần</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">Chống Brute-force tài khoản: Tài khoản sẽ chuyển sang trạng thái "Bị khóa" tạm thời khi nhập sai mật khẩu liên tiếp vượt hạn định.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: GRADING SCALE (UC-14) */}
          {activeTab === 'grading' && (
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden max-w-2xl">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-850">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-500" />
                  Cấu hình Thang điểm & Quy chế chấm điểm
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">

                {/* Grading Scale select */}
                <div className="space-y-3">
                  <Label className="text-xs font-extrabold text-slate-600 dark:text-slate-300">Thang điểm đánh giá chính của hệ thống</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setGradingScale('SCALE_10')}
                      className={`p-4 rounded-xl border text-left transition-all relative ${gradingScale === 'SCALE_10'
                        ? 'border-violet-600 bg-violet-500/5 text-violet-700 dark:text-violet-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                    >
                      <div className="font-extrabold text-xs">Thang điểm 10</div>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">Thang điểm truyền thống từ 0.0 đến 10.0. Dành cho các bài báo cáo, đồ án.</p>
                      {gradingScale === 'SCALE_10' && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setGradingScale('SCALE_4')}
                      className={`p-4 rounded-xl border text-left transition-all relative ${gradingScale === 'SCALE_4'
                        ? 'border-violet-600 bg-violet-500/5 text-violet-700 dark:text-violet-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                    >
                      <div className="font-extrabold text-xs">Thang điểm 4</div>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">Hệ thống tín chỉ chuẩn tích lũy học tập GPA (0 đến 4.0).</p>
                      {gradingScale === 'SCALE_4' && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setGradingScale('SCALE_LETTER')}
                      className={`p-4 rounded-xl border text-left transition-all relative ${gradingScale === 'SCALE_LETTER'
                        ? 'border-violet-600 bg-violet-500/5 text-violet-700 dark:text-violet-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                    >
                      <div className="font-extrabold text-xs">Thang điểm chữ</div>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">Quy chế đánh giá bằng chữ (A+, A, B+, B, C+, C, D, F).</p>
                      {gradingScale === 'SCALE_LETTER' && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500" />}
                    </button>
                  </div>
                </div>

                {/* Decimal rounding select */}
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-extrabold text-slate-600 dark:text-slate-300">Cơ chế làm tròn số thập phân</Label>
                  <select
                    value={decimalRounding}
                    onChange={e => setDecimalRounding(e.target.value as any)}
                    className="w-full max-w-xs h-10 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 focus:bg-white text-xs font-bold focus:ring-1 focus:ring-violet-500 focus:outline-none dark:bg-slate-950 dark:border-slate-850"
                  >
                    <option value="ROUND_HALF_UP">Làm tròn 1 chữ số thập phân</option>
                    <option value="ROUND_DOWN">Làm tròn xuống (Lấy phần nguyên)</option>
                    <option value="ROUND_UP">Làm tròn lên hoàn toàn</option>
                  </select>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Ví dụ: 7.25 → 7.3, 7.24 → 7.2
                  </p>
                </div>

                {/* Minimum pass score */}
                <div className="space-y-2">
                  <Label htmlFor="min-pass-score" className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                    Điểm số tối thiểu để vượt qua đánh giá (Qua môn) *
                  </Label>
                  <div className="relative max-w-xs">
                    <Input
                      id="min-pass-score"
                      type="number"
                      step={0.1}
                      value={minPassScore}
                      onChange={e => setMinPassScore(Number(e.target.value))}
                      className="rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 font-bold pr-12 text-xs"
                      min={0}
                      max={10}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Điểm</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">Mức điểm sàn chuẩn để báo cáo được ghi nhận là Đạt. Thấp hơn mức này sẽ bị xếp loại Không đạt.</p>
                </div>

              </CardContent>
            </Card>
          )}

          {/* TAB 4: NOTIFICATION TEMPLATES (UC-14) */}
          {activeTab === 'notifications' && (
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-850">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-violet-500" />
                  Cài đặt Mẫu thông báo & Kênh tương tác
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">

                {/* Active Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-850 dark:text-slate-200">Kênh Email (SMTP Mailer)</div>
                      <p className="text-[10px] text-slate-400 font-semibold">Tự động gửi email chứa nội dung thông báo trạng thái mới.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableEmailNotification(!enableEmailNotification)}
                      className={`w-11 h-6 rounded-full p-1 transition-all shrink-0 ${enableEmailNotification ? 'bg-violet-600 flex justify-end' : 'bg-slate-300 flex justify-start'
                        }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-850 dark:text-slate-200">Kênh In-App Notification</div>
                      <p className="text-[10px] text-slate-400 font-semibold">Bắn chuông thông báo trực tiếp trên giao diện website.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableInAppNotification(!enableInAppNotification)}
                      className={`w-11 h-6 rounded-full p-1 transition-all shrink-0 ${enableInAppNotification ? 'bg-violet-600 flex justify-end' : 'bg-slate-300 flex justify-start'
                        }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow" />
                    </button>
                  </div>

                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                {/* Templates editors */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Template 1: Submission Successful */}
                  <div className="space-y-2 text-left">
                    <Label htmlFor="template-sub" className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      Mẫu email: Nộp báo cáo thành công
                    </Label>
                    <textarea
                      id="template-sub"
                      rows={6}
                      value={emailTemplateSubmission}
                      onChange={e => setEmailTemplateSubmission(e.target.value)}
                      className="w-full p-3 text-xs font-semibold leading-relaxed rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 dark:bg-slate-950 dark:border-slate-800"
                    />
                    <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                      Tham số hỗ trợ: <code className="font-mono bg-slate-100 dark:bg-slate-800 text-violet-600 px-1 py-0.5 rounded">[STUDENT_NAME]</code>, <code className="font-mono bg-slate-100 dark:bg-slate-800 text-violet-600 px-1 py-0.5 rounded">[TOPIC_NAME]</code>, <code className="font-mono bg-slate-100 dark:bg-slate-800 text-violet-600 px-1 py-0.5 rounded">[TIME]</code>
                    </p>
                  </div>

                  {/* Template 2: Violation Warning Rejection */}
                  <div className="space-y-2 text-left">
                    <Label htmlFor="template-vio" className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      Mẫu email: Cảnh báo vi phạm & Từ chối báo cáo
                    </Label>
                    <textarea
                      id="template-vio"
                      rows={6}
                      value={emailTemplateViolation}
                      onChange={e => setEmailTemplateViolation(e.target.value)}
                      className="w-full p-3 text-xs font-semibold leading-relaxed rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 dark:bg-slate-950 dark:border-slate-800"
                    />
                    <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                      Tham số hỗ trợ: <code className="font-mono bg-slate-100 dark:bg-slate-800 text-violet-600 px-1 py-0.5 rounded">[STUDENT_NAME]</code>, <code className="font-mono bg-slate-100 dark:bg-slate-800 text-violet-600 px-1 py-0.5 rounded">[TOPIC_NAME]</code>, <code className="font-mono bg-slate-100 dark:bg-slate-800 text-violet-600 px-1 py-0.5 rounded">[REASON]</code>
                    </p>
                  </div>

                </div>

              </CardContent>
            </Card>
          )}

          {/* BOTTOM SAVE BUTTON FOR PREFERENCES */}
          <div className="flex items-center justify-end gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-6 py-5 shadow-lg shadow-violet-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu cấu hình tham số
            </Button>
          </div>

        </form>
      ) : (

        // ==========================================
        // TAB 5: KHÓA ĐIỂM HỌC KỲ WORKSPACE (UC-19 - MỚI)
        // ==========================================
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Col: Semesters Table & Locking Tool */}
            <div className="lg:col-span-2 space-y-6">

              {/* Semester table */}
              <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-850">
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-violet-500" />
                    Trạng thái kết quả các Kỳ học
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-850 text-xs font-bold text-slate-400 uppercase">
                          <th className="px-6 py-4 text-left">Tên Học kỳ</th>
                          <th className="px-6 py-4 text-left">Niên khóa</th>
                          <th className="px-6 py-4 text-center">Tiến độ phê duyệt</th>
                          <th className="px-6 py-4 text-center">Trạng thái khóa</th>
                          <th className="px-6 py-4 text-left">Lịch sử khóa điểm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {semesters.map(item => {
                          const isComplete = item.approvedClassesCount === item.totalClassesCount && item.totalClassesCount > 0;
                          const pct = item.totalClassesCount > 0 ? Math.round((item.approvedClassesCount / item.totalClassesCount) * 100) : 0;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20">

                              {/* Semester Name */}
                              <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-100">
                                {item.name}
                              </td>

                              {/* Academic Year */}
                              <td className="px-6 py-4 font-bold text-slate-500">
                                {item.academicYear}
                              </td>

                              {/* Approval progress */}
                              <td className="px-6 py-4 text-center">
                                <div className="space-y-1 inline-block text-left w-full max-w-[120px]">
                                  <div className="flex justify-between font-bold text-[10px]">
                                    <span className={isComplete ? 'text-green-600' : 'text-slate-400'}>
                                      {item.approvedClassesCount}/{item.totalClassesCount} Báo cáo
                                    </span>
                                    <span className={isComplete ? 'text-green-600' : 'text-slate-400'}>
                                      {pct}%
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                    <div
                                      className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Lock status Badge */}
                              <td className="px-6 py-4 text-center whitespace-nowrap">
                                {item.totalClassesCount === 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
                                    Chưa có dữ liệu
                                  </span>
                                ) : item.isLocked ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50">
                                    <Lock className="w-3 h-3" /> Đã niêm phong
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50">
                                    <Unlock className="w-3 h-3" /> Đang mở
                                  </span>
                                )}
                              </td>

                              {/* History locked log */}
                              <td className="px-6 py-4 text-left font-bold text-slate-400 text-[10px]">
                                {item.isLocked && item.lockedAt ? (
                                  <div className="space-y-0.5">
                                    <p className="text-slate-600 dark:text-slate-300">Khóa: {item.lockedAt}</p>
                                    <p>Bởi: {item.lockedBy}</p>
                                  </div>
                                ) : (
                                  <span>—</span>
                                )}
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Col: Locking Form panel */}
            <div className="space-y-6">

              <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden sticky top-24">
                <CardHeader className="p-6 border-b border-rose-100 dark:border-rose-950 bg-rose-500/5">
                  <CardTitle className="text-base font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-rose-500" />
                    Khóa kết quả Học kỳ
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-rose-600 dark:text-rose-400/80 mt-1">
                    Hành động ĐÓNG BĂNG điểm số vĩnh viễn sau khi Phòng Đào tạo xác nhận phê duyệt hoàn tất.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLockSemesterResults}>
                  <CardContent className="p-6 space-y-4">

                    {/* Select active semester to lock */}
                    <div className="space-y-2 text-left">
                      <Label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Chọn học kỳ cần khóa điểm *</Label>
                      <select
                        value={selectedSemesterToLock}
                        onChange={e => {
                          setSelectedSemesterToLock(e.target.value);
                          setSecurityConfirmText('');
                        }}
                        className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white text-xs font-bold focus:ring-1 focus:ring-violet-500 focus:outline-none dark:bg-slate-950 dark:border-slate-850"
                        required
                      >
                        <option value="">-- Click chọn học kỳ --</option>
                        {semesters.filter(s => !s.isLocked).map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.academicYear})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Specific semester info details */}
                    {selectedSemesterToLock && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2 text-left animate-in slide-in-from-top-2 duration-200">
                        {isLoadingStats ? (
                          <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                            Đang truy xuất thống kê học kỳ...
                          </div>
                        ) : selectedSemesterStats ? (
                          <div className="text-xs font-semibold leading-relaxed space-y-1.5">
                            <p className="font-extrabold text-slate-800 dark:text-slate-200">Chi tiết trạng thái điều kiện khóa:</p>
                            <div className="space-y-1 pl-1">
                              <p className="flex items-center justify-between">
                                <span>Tiến độ nộp & Phê duyệt:</span>
                                <strong className={selectedSemesterStats.approvedReports === selectedSemesterStats.totalReports && selectedSemesterStats.totalReports > 0 ? 'text-green-600' : 'text-amber-500'}>
                                  {selectedSemesterStats.approvedReports === selectedSemesterStats.totalReports && selectedSemesterStats.totalReports > 0
                                    ? 'ĐÃ HOÀN TẤT (100%)'
                                    : `CHƯA HOÀN TẤT (${Math.round((selectedSemesterStats.approvedReports / (selectedSemesterStats.totalReports || 1)) * 100)}%)`}
                                </strong>
                              </p>
                              <p className="flex items-center justify-between">
                                <span>Tổng số báo cáo:</span>
                                <strong>{selectedSemesterStats.totalReports} báo cáo</strong>
                              </p>
                              <p className="flex items-center justify-between">
                                <span>Đã phê duyệt (HOÀN THÀNH):</span>
                                <strong className="text-green-600">{selectedSemesterStats.approvedReports}</strong>
                              </p>
                              <p className="flex items-center justify-between">
                                <span>Chờ chấm / Mới nộp:</span>
                                <strong className="text-blue-500">{selectedSemesterStats.pendingReports}</strong>
                              </p>
                              <p className="flex items-center justify-between">
                                <span>Từ chối / Yêu cầu sửa:</span>
                                <strong className="text-rose-500">{selectedSemesterStats.rejectedReports}</strong>
                              </p>
                            </div>

                            {selectedSemesterStats.approvedReports < selectedSemesterStats.totalReports || selectedSemesterStats.totalReports === 0 ? (
                              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-400 rounded-lg text-[10px] mt-2 font-bold leading-normal flex items-start gap-1.5">
                                <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                                Chặn tác vụ: Admin chỉ được phép khóa kết quả học kỳ khi 100% báo cáo đã hoàn thành phê duyệt bởi Phòng Đào tạo và tổng báo cáo lớn hơn 0!
                              </div>
                            ) : (
                              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-800 dark:text-green-400 rounded-lg text-[10px] mt-2 font-bold leading-normal flex items-start gap-1.5">
                                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                                Học kỳ ĐỦ ĐIỀU KIỆN KHÓA ĐIỂM AN TOÀN. Vui lòng nhập mã bảo mật bên dưới để niêm phong dữ liệu.
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Verification input field */}
                    {selectedSemesterStats && selectedSemesterStats.approvedReports === selectedSemesterStats.totalReports && selectedSemesterStats.totalReports > 0 && (
                      <div className="space-y-2 animate-in slide-in-from-top-2 duration-200 text-left">
                        <Label htmlFor="security-code" className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          Xác thực: Nhập mã bảo mật để xác nhận *
                        </Label>
                        <Input
                          id="security-code"
                          type="text"
                          placeholder="Gõ đúng: XAC NHAN KHOA DIEM"
                          value={securityConfirmText}
                          onChange={e => setSecurityConfirmText(e.target.value)}
                          className="rounded-xl border-rose-200 bg-rose-50/20 focus:bg-white dark:bg-slate-950 dark:border-rose-900/40 text-xs font-bold font-mono text-center tracking-wider"
                          required
                        />
                        <p className="text-[10px] text-rose-500 font-bold leading-normal text-left">
                          Lưu ý cực kỳ quan trọng: Hành động này không thể hoàn tác! Toàn bộ kết quả điểm số của tất cả sinh viên trong học kỳ này sẽ được niêm phong vĩnh viễn trên Cơ sở dữ liệu.
                        </p>
                      </div>
                    )}

                  </CardContent>
                  <CardFooter className="p-6 border-t border-slate-100 dark:border-slate-850">
                    {(() => {
                      const isComplete = selectedSemesterStats && selectedSemesterStats.approvedReports === selectedSemesterStats.totalReports && selectedSemesterStats.totalReports > 0;
                      const isCodeMatch = securityConfirmText === "XAC NHAN KHOA DIEM";
                      return (
                        <Button
                          type="submit"
                          disabled={!isComplete || !isCodeMatch || isLockingInProgress}
                          className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 text-white font-extrabold rounded-xl py-5 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 transition-all active:scale-95"
                        >
                          {isLockingInProgress ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                          Khóa kết quả điểm vĩnh viễn
                        </Button>
                      );
                    })()}
                  </CardFooter>
                </form>
              </Card>

            </div>

          </div>
        </div>

      )}

    </div>
  );
}
