import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  BookOpen,
  GraduationCap,
  Info,
  ShieldAlert,
  Loader2,
  X,
  AlertOctagon,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import type { SubmissionStatus } from '../../types';
import { academicService } from '../../services/academicService';
import { teacherService } from '../../services/teacherService';

interface SubmissionUI {
  id: string;
  topicName: string;
  groupId: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  courseName: string;
  courseId: string;
  semesterName: string;
  semesterId: string;
  department: string;
  status: SubmissionStatus;
  plagiarismScore: number;
  classCode: string;
  classId: string;
  version: number;
  deadlineAt: string;
  submittedAt: string;
  violationReason?: string;
  editNote?: string;
}

export default function ProgressMonitoring() {
  const [submissions, setSubmissions] = useState<SubmissionUI[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // State Bộ lọc nâng cao
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState('All');
  const [selectedPlagRange, setSelectedPlagRange] = useState('All'); // All, NORMAL, NEED_CHECK, HIGH_ALERT
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  // State Dialog Xử lý vi phạm (Reject/Review)
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [selectedSubForViolation, setSelectedSubForViolation] = useState<SubmissionUI | null>(null);
  const [violationType, setViolationType] = useState('DA_VAN'); // DA_VAN, SAI_DE_TAI, SAI_DINH_DANG, FILE_LOI, KHAC
  const [violationReasonText, setViolationReasonText] = useState('');
  const [isSubmittingViolation, setIsSubmittingViolation] = useState(false);
  const [isSubmittingReviewRequest, setIsSubmittingReviewRequest] = useState(false);

  // State Dialog Xem chi tiết
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSubForDetail, setSelectedSubForDetail] = useState<SubmissionUI | null>(null);

  // Ngưỡng đạo văn từ hệ thống (20%)
  const PLAGIARISM_THRESHOLD = 20;

  // Tải danh sách bài nộp thực tế từ Postgres DB
  const loadSubmissionsData = async () => {
    setIsLoadingSubmissions(true);
    try {
      const liveData = await academicService.getAllSubmissions();
      const mapped: SubmissionUI[] = liveData.map((s: any) => {
        let studentName = 'Chưa phân công';
        let studentId = '—';
        if (s.student?.user) {
          studentName = s.student.user.fullName;
          studentId = s.student.studentCode;
        } else if (s.group?.students && s.group.students.length > 0) {
          studentName = s.group.students.map((st: any) => st.user?.fullName).filter(Boolean).join(', ');
          studentId = s.group.students.map((st: any) => st.studentCode).filter(Boolean).join(', ');
        }

        const cls = s.class || s.student?.class || s.group?.class;
        const topicName = s.group?.topicName || 'Báo cáo Học phần';
        const courseName = cls?.subject?.name || 'Môn học chung';
        const semesterName = cls?.term?.name || 'Học kỳ mặc định';
        const classCode = cls?.classCode || 'Lớp học phần';
        const department = cls?.subject?.subjectCode?.substring(0, 4)?.toUpperCase()?.includes('SE')
          ? 'CNPM'
          : cls?.subject?.subjectCode?.substring(0, 4)?.toUpperCase()?.includes('IS')
            ? 'HTTT'
            : 'KTMT';

        const plagiarismScore = s.plagiarismScore || 0;
        const teacherId = s.grades?.[0]?.teacherId || cls?.assignments?.[0]?.teacherId || 'Chưa phân gv';
        const teacherName = s.grades?.[0]?.teacher?.user?.fullName || cls?.assignments?.[0]?.teacher?.user?.fullName || 'Chưa phân công';

        return {
          id: s.id,
          topicName,
          groupId: s.groupId || 'CÁ NHÂN',
          studentId,
          studentName,
          teacherId,
          teacherName,
          courseName,
          courseId: cls?.subjectId || cls?.subject?.id || '—',
          semesterName,
          semesterId: cls?.termId || cls?.term?.id || '—',
          department,
          status: s.status as SubmissionStatus,
          plagiarismScore,
          classCode,
          classId: cls?.id || '—',
          version: s.version,
          deadlineAt: cls?.term?.endDate || new Date().toISOString(),
          submittedAt: s.submittedAt || s.createdAt,
          violationReason: s.rejectReason || undefined,
          editNote: s.editRequestNote || undefined
        };
      });
      setSubmissions(mapped);
    } catch (error: any) {
      toast.error(`Nạp tiến trình nộp báo cáo thất bại: ${error.message}`);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    loadSubmissionsData();
  }, []);

  // Lấy các giá trị duy nhất động cho bộ lọc
  const semesters = ['All', ...Array.from(new Set(submissions.map(s => s.semesterName).filter(Boolean)))];
  const courses = ['All', ...Array.from(new Set(submissions.map(s => s.courseName).filter(Boolean)))];
  const classCodes = ['All', ...Array.from(new Set(submissions.map(s => s.classCode).filter(Boolean)))];
  const teachers = ['All', ...Array.from(new Set(submissions.map(s => s.teacherName).filter(Boolean)))];

  // Helper tính khoảng cách trễ hạn nộp bài hoặc quá hạn
  const getDelayInfo = (submittedAt: string | null | undefined, deadlineAt: string) => {
    const now = new Date();
    const deadline = new Date(deadlineAt);

    if (submittedAt) {
      const submitted = new Date(submittedAt);
      if (submitted <= deadline) {
        return { statusType: 'ON_TIME', text: 'Đúng hạn', isLate: false, hasAlert: false };
      } else {
        const diffTime = Math.abs(submitted.getTime() - deadline.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const text = diffDays > 0 ? `Nộp trễ ${diffDays} ngày ${diffHours} giờ` : `Nộp trễ ${diffHours} giờ`;
        return { statusType: 'LATE', text, isLate: true, hasAlert: true };
      }
    } else {
      // Chưa nộp bài
      if (now <= deadline) {
        const diffTime = Math.abs(deadline.getTime() - now.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const text = diffDays > 0 ? `Chưa nộp · còn ${diffDays} ngày ${diffHours} giờ` : `Chưa nộp · còn ${diffHours} giờ`;
        return { statusType: 'NOT_SUBMITTED_BEFORE', text, isLate: false, hasAlert: false };
      } else {
        return { statusType: 'OVERDUE_NOT_SUBMITTED', text: 'Quá hạn · chưa nộp', isLate: true, hasAlert: true };
      }
    }
  };

  // Thực hiện lọc dữ liệu nâng cao
  const filteredSubmissions = submissions.filter(item => {
    const matchesSearch =
      item.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.groupId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSemester = selectedSemester === 'All' || item.semesterName === selectedSemester;
    const matchesCourse = selectedCourse === 'All' || item.courseName === selectedCourse;
    const matchesClass = selectedClass === 'All' || item.classCode === selectedClass;
    const matchesTeacher = selectedTeacher === 'All' || item.teacherName === selectedTeacher;

    let matchesStatus = true;
    if (selectedStatus !== 'All') {
      if (selectedStatus === 'PLAGIARISM_ALERT') {
        matchesStatus = item.plagiarismScore > PLAGIARISM_THRESHOLD && item.status !== 'TU_CHOI';
      } else if (selectedStatus === 'CHO_KIEM_TRA') {
        matchesStatus = !!(item.violationReason && item.violationReason.includes('"type":"CHO_KIEM_TRA"'));
      } else {
        matchesStatus = item.status === selectedStatus;
      }
    }

    let matchesPlagRange = true;
    if (selectedPlagRange !== 'All') {
      if (selectedPlagRange === 'NORMAL') matchesPlagRange = item.plagiarismScore <= 20;
      else if (selectedPlagRange === 'NEED_CHECK') matchesPlagRange = item.plagiarismScore > 20 && item.plagiarismScore <= 40;
      else if (selectedPlagRange === 'HIGH_ALERT') matchesPlagRange = item.plagiarismScore > 40 && item.plagiarismScore <= 60;
      else if (selectedPlagRange === 'CRITICAL') matchesPlagRange = item.plagiarismScore > 60;
    }

    const delayInfo = getDelayInfo(item.submittedAt, item.deadlineAt);
    const hasPendingReview = !!(item.violationReason && (item.violationReason.includes('"type":"CHO_KIEM_TRA"') || item.violationReason.includes('"status":"CHO_KIEM_TRA"')));
    const hasWarning = item.plagiarismScore > PLAGIARISM_THRESHOLD || delayInfo.hasAlert || hasPendingReview;
    const matchesOnlyAlerts = !showOnlyAlerts || hasWarning;

    return matchesSearch && matchesSemester && matchesCourse && matchesClass && matchesTeacher && matchesStatus && matchesPlagRange && matchesOnlyAlerts;
  });

  // Tính toán số liệu thống kê (Stats Cards)
  const totalCount = submissions.length;
  const completedCount = submissions.filter(s => s.status === 'HOAN_THANH').length;
  const pendingGradingCount = submissions.filter(s => ['DA_NOP', 'DANG_CHAM', 'YEU_CAU_SUA'].includes(s.status)).length;
  const pendingApprovalCount = submissions.filter(s => s.status === 'CHO_DUYET').length;
  const plagiarismAlertCount = submissions.filter(s => s.plagiarismScore > PLAGIARISM_THRESHOLD && s.status !== 'TU_CHOI').length;
  const rejectedCount = submissions.filter(s => s.status === 'TU_CHOI').length;

  // Xử lý nộp quyết định từ chối vi phạm (Reject - TU_CHOI)
  const handleConfirmViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForViolation) return;
    if (!violationReasonText.trim()) {
      toast.error('Vui lòng nhập lý do từ chối báo cáo vi phạm!');
      return;
    }

    setIsSubmittingViolation(true);
    toast.loading('Đang ghi nhận quyết định từ chối lên hệ thống...', { id: 'submit-viol' });

    try {
      const typeLabels: Record<string, string> = {
        DA_VAN: 'Đạo văn',
        SAI_DE_TAI: 'Nộp sai đề tài',
        SAI_DINH_DANG: 'Sai định dạng nghiêm trọng',
        FILE_LOI: 'Tệp tin báo cáo bị hỏng',
        KHAC: 'Khác'
      };
      const formattedReason = `[Từ chối - ${typeLabels[violationType] || 'Lỗi vi phạm'}]: ${violationReasonText}`;

      await teacherService.updateSubmissionStatus(selectedSubForViolation.id, {
        status: 'TU_CHOI',
        rejectReason: formattedReason,
        version: selectedSubForViolation.version
      });

      toast.success(`Đã từ chối phê duyệt báo cáo ${selectedSubForViolation.id}. Trạng thái chuyển sang Bị từ chối (TU_CHOI).`, { id: 'submit-viol' });
      setIsViolationModalOpen(false);
      setSelectedSubForViolation(null);
      setViolationReasonText('');
      await loadSubmissionsData();
    } catch (err: any) {
      toast.error(`Từ chối báo cáo vi phạm thất bại: ${err.message}`, { id: 'submit-viol' });
    } finally {
      setIsSubmittingViolation(false);
    }
  };

  // Xử lý gửi Yêu cầu kiểm tra lại cho Giảng viên hướng dẫn (Ghi log CHO_KIEM_TRA)
  const handleRequestReview = async () => {
    if (!selectedSubForViolation) return;
    if (!violationReasonText.trim()) {
      toast.error('Vui lòng nhập lý do/đặc tả yêu cầu kiểm tra lại!');
      return;
    }

    setIsSubmittingReviewRequest(true);
    toast.loading('Đang ghi nhận yêu cầu và gửi thông báo kiểm tra đến Giảng viên phụ trách...', { id: 'submit-review' });

    try {
      const typeLabels: Record<string, string> = {
        DA_VAN: 'Đạo văn',
        SAI_DE_TAI: 'Nộp sai đề tài',
        SAI_DINH_DANG: 'Sai định dạng nghiêm trọng',
        FILE_LOI: 'Tệp tin báo cáo bị hỏng',
        KHAC: 'Khác'
      };

      const reviewLog = {
        type: 'CHO_KIEM_TRA',
        status: 'CHO_KIEM_TRA',
        warningType: typeLabels[violationType] || 'Quy chế',
        violationType: typeLabels[violationType] || 'Quy chế',
        reason: violationReasonText,
        createdBy: 'Quản trị viên (Admin)',
        createdAt: new Date().toISOString()
      };

      // Giữ nguyên trạng thái hiện tại của bài nộp, chỉ cập nhật trường rejectReason làm log review
      await teacherService.updateSubmissionStatus(selectedSubForViolation.id, {
        status: selectedSubForViolation.status,
        rejectReason: JSON.stringify(reviewLog),
        version: selectedSubForViolation.version
      });

      toast.success(`Đã lưu log cảnh báo vi phạm. Trạng thái hiển thị là "Chờ kiểm tra", hệ thống đã gửi thông báo đến Giảng viên hướng dẫn!`, { id: 'submit-review' });
      setIsViolationModalOpen(false);
      setSelectedSubForViolation(null);
      setViolationReasonText('');
      await loadSubmissionsData();
    } catch (err: any) {
      toast.error(`Gửi yêu cầu kiểm tra lại thất bại: ${err.message}`, { id: 'submit-review' });
    } finally {
      setIsSubmittingReviewRequest(false);
    }
  };

  // Helper render Badge trạng thái báo cáo tiếng Việt chuyên nghiệp
  const renderStatusBadge = (status: SubmissionStatus, plagScore: number, violationReason?: string) => {
    const isPendingReview = !!(violationReason && violationReason.includes('"type":"CHO_KIEM_TRA"'));

    if (isPendingReview) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40 animate-pulse shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Chờ kiểm tra
        </span>
      );
    }

    switch (status) {
      case 'HOAN_THANH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> Đã phê duyệt
          </span>
        );
      case 'CHO_DUYET':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40 shadow-sm animate-pulse">
            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Chờ PĐT duyệt
          </span>
        );
      case 'YEU_CAU_SUA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40 shadow-sm">
            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Yêu cầu sửa
          </span>
        );
      case 'TU_CHOI':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40 shadow-sm">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Bị từ chối
          </span>
        );
      case 'DA_CHAM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Đã chấm điểm
          </span>
        );
      case 'DANG_CHAM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" /> Đang chấm
          </span>
        );
      case 'DA_NOP':
      default:
        if (plagScore > PLAGIARISM_THRESHOLD) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 animate-pulse shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" /> Nghi vấn đạo văn
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/40 shadow-sm">
            <FileText className="w-3.5 h-3.5 text-violet-500 shrink-0" /> Đã nộp — chờ GV chấm
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
            Giám sát hệ thống & vi phạm
          </h1>
        </div>
      </div>

      {/* STATISTICAL OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

        {/* TOTAL SUBMISSIONS */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Tổng báo cáo</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block">{totalCount}</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* COMPLETED/APPROVED */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Đã phê duyệt</span>
              <span className="text-2xl font-black text-green-600 dark:text-green-400 block">
                {completedCount}
                <span className="text-[10px] font-semibold text-slate-400 ml-1">({Math.round((completedCount / totalCount) * 100) || 0}%)</span>
              </span>
              <span className="text-[9px] text-slate-400 block font-medium">Chỉ giám sát số lượng — quyền phê duyệt thuộc Phòng Đào tạo</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* PENDING GRADING */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Đang chấm / Sửa</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block">{pendingGradingCount}</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* PENDING APPROVAL */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Chờ PDT duyệt</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 block">{pendingApprovalCount}</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* PLAGIARISM ALERTS + VIOLATIONS */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Vi phạm / Nghi vấn</span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 block">
                {plagiarismAlertCount + rejectedCount}
                <span className="text-xs font-semibold text-slate-400 ml-1">({rejectedCount} đã khóa)</span>
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* FILTER PANEL */}
      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <SlidersHorizontal className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Bộ lọc nâng cao</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Search Input */}
            <div className="space-y-1.5">
              <Label htmlFor="search-sub" className="text-xs font-bold text-slate-500">Từ khóa tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="search-sub"
                  placeholder="MSSV, Mã nhóm, Tên sinh viên, Đề tài..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="rounded-xl bg-slate-50 border-slate-200/80 focus:bg-white pl-9.5 text-xs font-semibold dark:bg-slate-950 dark:border-slate-800"
                />
              </div>
            </div>

            {/* Semester Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Học học kỳ</Label>
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white text-xs font-bold focus:ring-1 focus:ring-violet-500 focus:outline-none dark:bg-slate-950 dark:border-slate-800"
              >
                {semesters.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'Tất cả Học kỳ' : s}</option>
                ))}
              </select>
            </div>

            {/* Course Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Môn học</Label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white text-xs font-bold focus:ring-1 focus:ring-violet-500 focus:outline-none dark:bg-slate-950 dark:border-slate-800"
              >
                {courses.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'Tất cả Môn học' : c}</option>
                ))}
              </select>
            </div>

            {/* Class Section Select (New Filter) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Lớp học phần</Label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white text-xs font-bold focus:ring-1 focus:ring-violet-500 focus:outline-none dark:bg-slate-950 dark:border-slate-800"
              >
                {classCodes.map(cls => (
                  <option key={cls} value={cls}>{cls === 'All' ? 'Tất cả Lớp' : cls}</option>
                ))}
              </select>
            </div>

            {/* Teacher Select (New Filter) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Giảng viên phụ trách</Label>
              <select
                value={selectedTeacher}
                onChange={e => setSelectedTeacher(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white text-xs font-bold focus:ring-1 focus:ring-violet-500 focus:outline-none dark:bg-slate-950 dark:border-slate-800"
              >
                {teachers.map(t => (
                  <option key={t} value={t}>{t === 'All' ? 'Tất cả Giảng viên' : t}</option>
                ))}
              </select>
            </div>

            {/* Plagiarism Range Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Mức đạo văn</Label>
              <select
                value={selectedPlagRange}
                onChange={e => setSelectedPlagRange(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white text-xs font-bold focus:ring-1 focus:ring-violet-500 focus:outline-none dark:bg-slate-950 dark:border-slate-800"
              >
                <option value="All">Tất cả mức độ</option>
                <option value="NORMAL">Bình thường (0–20%)</option>
                <option value="NEED_CHECK">Cần kiểm tra (21–40%)</option>
                <option value="HIGH_ALERT">Nghi vấn cao (41–60%)</option>
                <option value="CRITICAL">Rất nghiêm trọng (&gt;60%)</option>
              </select>
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Trạng thái báo cáo / Cảnh báo</Label>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white text-xs font-bold focus:ring-1 focus:ring-violet-500 focus:outline-none dark:bg-slate-950 dark:border-slate-800"
              >
                <option value="All">Tất cả Trạng thái</option>
                <option value="DA_NOP">Đã nộp — chờ GV chấm</option>
                <option value="PLAGIARISM_ALERT">Nghi vấn Đạo văn (&gt; {PLAGIARISM_THRESHOLD}%)</option>
                <option value="CHO_KIEM_TRA">Chờ Admin/GV kiểm tra</option>
                <option value="YEU_CAU_SUA">Yêu cầu sửa điểm/nội dung</option>
                <option value="DA_CHAM">Đã chấm điểm</option>
                <option value="CHO_DUYET">Chờ PĐT duyệt</option>
                <option value="HOAN_THANH">Đã phê duyệt</option>
                <option value="TU_CHOI">Bị từ chối</option>
              </select>
            </div>

            {/* Checkbox Warning Toggle (New Filter) */}
            <div className="flex items-center gap-2 self-end h-10">
              <input
                type="checkbox"
                id="checkbox-alerts"
                checked={showOnlyAlerts}
                onChange={e => setShowOnlyAlerts(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
              <Label htmlFor="checkbox-alerts" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                Chỉ hiển thị báo cáo có cảnh báo
              </Label>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* SUBMISSIONS DETAILED PROGRESS TABLE */}
      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-500" />
              Danh sách chi tiết Tiến độ & Vi phạm ({filteredSubmissions.length} báo cáo)
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-400 mt-1">
              Hiển thị danh sách báo cáo nộp, phiên bản, giảng viên phụ trách, thời hạn nộp, tỷ lệ đạo văn và thao tác xử lý.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1350px] table-fixed">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-850 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4 text-left w-[18%]">Đề tài & Nhóm</th>
                  <th className="px-6 py-4 text-left w-[13%]">Sinh viên</th>
                  <th className="px-6 py-4 text-left w-[11%]">Thông tin lớp môn</th>
                  <th className="px-6 py-4 text-left w-[10%]">Giảng viên phụ trách</th>
                  <th className="px-6 py-4 text-left w-[11%]">Thời hạn nộp / Trạng thái</th>
                  <th className="px-6 py-4 text-center w-[5%]">Đạo văn (%)</th>
                  <th className="px-6 py-4 text-center w-[14%]">Trạng thái</th>
                  <th className="px-6 py-4 text-center w-[18%]">Thao tác xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoadingSubmissions ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
                        <span className="text-sm font-semibold text-slate-400">Đang tải tiến trình nộp báo cáo...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm font-semibold text-slate-400">
                      Không tìm thấy báo cáo nào phù hợp với bộ lọc tìm kiếm!
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map(item => {
                    const delayInfo = getDelayInfo(item.submittedAt, item.deadlineAt);
                    const isPlagiarismAlert = item.plagiarismScore > PLAGIARISM_THRESHOLD;
                    const hasPendingReview = !!(item.violationReason && (item.violationReason.includes('"type":"CHO_KIEM_TRA"') || item.violationReason.includes('"status":"CHO_KIEM_TRA"')));
                    const hasWarning = isPlagiarismAlert || delayInfo.hasAlert || hasPendingReview;

                    // Mức đạo văn
                    let plagText = "Bình thường";
                    let plagColor = "text-green-600 dark:text-green-400";
                    let plagBg = "bg-green-500";
                    if (item.plagiarismScore > 60) {
                      plagText = "Rất nghiêm trọng";
                      plagColor = "text-red-750 dark:text-red-500 font-extrabold animate-pulse";
                      plagBg = "bg-red-700";
                    } else if (item.plagiarismScore > 40) {
                      plagText = "Nghi vấn cao";
                      plagColor = "text-rose-600 dark:text-rose-400";
                      plagBg = "bg-rose-500";
                    } else if (item.plagiarismScore > 20) {
                      plagText = "Cần kiểm tra";
                      plagColor = "text-amber-600 dark:text-amber-400";
                      plagBg = "bg-amber-500";
                    }

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors ${hasWarning && item.status !== 'TU_CHOI'
                          ? 'bg-rose-50/5 dark:bg-rose-950/5'
                          : ''
                          }`}
                      >
                        {/* Topic, Group, Version */}
                        <td className="px-6 py-5 text-left break-words min-w-0">
                          <div className="font-extrabold text-xs text-slate-800 dark:text-slate-100 line-clamp-2 leading-relaxed mb-1.5" title={item.topicName}>
                            {item.topicName}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-400 min-w-0">
                            <span className="bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-mono inline-block align-middle" title={item.id}>
                              {item.id.length > 10 ? item.id.substring(0, 8) + '...' : item.id}
                            </span>
                            <span>•</span>
                            <span className="text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-1.5 py-0.5 rounded font-mono inline-block align-middle" title={item.groupId}>
                              {item.groupId.length > 12 ? `Nhóm: ${item.groupId.substring(0, 6)}...` : item.groupId}
                            </span>
                            <span>•</span>
                            <span className="bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-slate-500 inline-block align-middle">v{item.version}</span>
                          </div>
                        </td>

                        {/* Student Name & ID */}
                        <td className="px-6 py-5 text-left min-w-0">
                          {(() => {
                            const names = item.studentName.split(', ');
                            const ids = item.studentId.split(', ');
                            return (
                              <div className="flex flex-col gap-1.5 min-w-0">
                                {names.map((name, idx) => (
                                  <div key={idx} className="flex flex-col">
                                    <span className="font-extrabold text-xs text-slate-850 dark:text-slate-200 leading-normal">{name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{ids[idx] || ''}</span>
                                  </div>
                                ))}
                                <div className="mt-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded inline-block">Lớp: {item.classCode}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Course & Semester */}
                        <td className="px-6 py-5 text-left break-words min-w-0">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="font-bold text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2" title={item.courseName}>
                              {item.courseName}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 truncate" title={item.semesterName}>{item.semesterName}</div>
                          </div>
                        </td>

                        {/* Lecturer In Charge */}
                        <td className="px-6 py-5 text-left break-words">
                          <div className="flex flex-col gap-1">
                            <div className="font-bold text-xs text-slate-700 dark:text-slate-300">{item.teacherName}</div>
                            <div className="text-[10px] font-bold text-slate-400">{item.teacherId}</div>
                          </div>
                        </td>

                        {/* Deadline & Delay status */}
                        <td className="px-6 py-5 text-left">
                          <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-semibold text-slate-500">
                              Hạn: {new Date(item.deadlineAt).toLocaleString('vi-VN')}
                            </div>
                            {item.submittedAt && (
                              <div className="text-[10px] font-bold text-slate-400">
                                Nộp: {new Date(item.submittedAt).toLocaleString('vi-VN')}
                              </div>
                            )}
                            <div>
                              {(() => {
                                if (delayInfo.statusType === 'ON_TIME') {
                                  return (
                                    <span className="inline-block bg-green-50 text-green-600 dark:bg-green-950/20 px-2 py-0.5 rounded text-[9px] font-bold border border-green-100 dark:border-green-900/30 shadow-sm">
                                      Đúng hạn
                                    </span>
                                  );
                                } else if (delayInfo.statusType === 'LATE') {
                                  return (
                                    <span className="inline-block bg-rose-50 text-rose-600 dark:bg-rose-950/20 px-2 py-0.5 rounded text-[9px] font-bold border border-rose-100 dark:border-rose-900/30 shadow-sm">
                                      {delayInfo.text}
                                    </span>
                                  );
                                } else if (delayInfo.statusType === 'NOT_SUBMITTED_BEFORE') {
                                  return (
                                    <span className="inline-block bg-blue-50 text-blue-600 dark:bg-blue-950/20 px-2 py-0.5 rounded text-[9px] font-bold border border-blue-100 dark:border-blue-900/30 shadow-sm">
                                      {delayInfo.text}
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="inline-block bg-red-100 text-red-700 dark:bg-red-950/30 px-2 py-0.5 rounded text-[9px] font-extrabold border border-red-250 dark:border-red-900/40 shadow-sm animate-pulse">
                                      Quá hạn · chưa nộp
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </td>

                        {/* Plagiarism Similarity Gauge */}
                        <td className="px-6 py-5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubForDetail(item);
                              setIsDetailModalOpen(true);
                            }}
                            className="group hover:underline text-center inline-block"
                            title="Xem chi tiết nguồn đối chiếu đạo văn"
                          >
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <span className={`text-xs font-black ${plagColor}`}>
                                {item.plagiarismScore}%
                              </span>
                            </div>
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner mx-auto mb-1">
                              <div
                                className={`h-full rounded-full transition-all ${plagBg}`}
                                style={{ width: `${item.plagiarismScore}%` }}
                              />
                            </div>
                            <span className={`text-[8.5px] font-bold block ${plagColor} uppercase tracking-wider`}>
                              {plagText}
                            </span>
                          </button>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-5 text-center whitespace-nowrap">
                          {renderStatusBadge(item.status, item.plagiarismScore, item.violationReason)}
                        </td>

                        {/* Quick Action Button for Admin */}
                        <td className="px-6 py-5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* Nút Chi tiết */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSubForDetail(item);
                                setIsDetailModalOpen(true);
                              }}
                              className="h-8 rounded-lg text-[10px] font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 flex items-center gap-1 px-2.5 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" /> Chi tiết
                            </Button>

                            {/* Nút Kiểm tra / xử lý vi phạm - Hiện có điều kiện nếu có cảnh báo */}
                            {hasWarning && item.status !== 'TU_CHOI' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedSubForViolation(item);
                                  setIsViolationModalOpen(true);
                                }}
                                className={`h-8 rounded-lg text-[10px] font-bold px-2.5 flex items-center gap-1.5 shadow-sm border border-transparent transition-all ${isPlagiarismAlert
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/10'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:border-slate-800'
                                  }`}
                              >
                                <ShieldAlert className="w-3.5 h-3.5" /> Kiểm tra / xử lý
                              </Button>
                            )}

                            {/* Lý do nếu đã bị Từ chối */}
                            {item.status === 'TU_CHOI' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubForDetail(item);
                                  setIsDetailModalOpen(true);
                                }}
                                className="h-8 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 px-2 flex items-center gap-1"
                              >
                                <Info className="w-3.5 h-3.5" /> Lý do từ chối
                              </Button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG 1: MODAL XỬ LÝ VI PHẠM (RE-DESIGNED - UC-15) */}
      {isViolationModalOpen && selectedSubForViolation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 text-left">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-500/5">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-5.5 h-5.5 text-rose-600 dark:text-rose-500 shrink-0" />
                <div>
                  <h3 className="text-base font-extrabold text-rose-700 dark:text-rose-500">Xử lý Vi phạm Quy chế Báo cáo</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Tác vụ: Quyết định từ chối phê duyệt hoặc gửi thẩm định lại</p>
                </div>
              </div>
              <button
                onClick={() => setIsViolationModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">

              {/* Detailed Report Metadata Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2.5 text-xs">
                <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-snug border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                  {selectedSubForViolation.topicName}
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-slate-500">
                  <div><strong className="text-slate-700 dark:text-slate-400">Mã báo cáo:</strong> {selectedSubForViolation.id}</div>
                  <div><strong className="text-slate-700 dark:text-slate-400">MSSV/Nhóm:</strong> {selectedSubForViolation.groupId}</div>
                  <div><strong className="text-slate-700 dark:text-slate-400">Sinh viên:</strong> {selectedSubForViolation.studentName}</div>
                  <div><strong className="text-slate-700 dark:text-slate-400">Lớp môn học:</strong> {selectedSubForViolation.classCode} ({selectedSubForViolation.courseName})</div>
                  <div><strong className="text-slate-700 dark:text-slate-400">Giảng viên chấm:</strong> {selectedSubForViolation.teacherName}</div>
                  <div><strong className="text-slate-700 dark:text-slate-400">Tỉ lệ trùng lặp:</strong> <span className="text-rose-600 font-extrabold">{selectedSubForViolation.plagiarismScore}%</span></div>
                  <div className="col-span-2">
                    <strong className="text-slate-700 dark:text-slate-400">Trạng thái nộp:</strong>{' '}
                    {(() => {
                      const dInfo = getDelayInfo(selectedSubForViolation.submittedAt, selectedSubForViolation.deadlineAt);
                      if (dInfo.statusType === 'ON_TIME') {
                        return <span className="text-green-550 font-extrabold">Đúng hạn</span>;
                      } else if (dInfo.statusType === 'LATE') {
                        return <span className="text-rose-500 font-extrabold">{dInfo.text}</span>;
                      } else if (dInfo.statusType === 'NOT_SUBMITTED_BEFORE') {
                        return <span className="text-blue-500 font-extrabold">{dInfo.text}</span>;
                      } else {
                        return <span className="text-red-650 font-black animate-pulse">Quá hạn · chưa nộp</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Warning Alert */}
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-400 rounded-xl text-xs font-semibold leading-relaxed">
                <strong className="block mb-0.5">Chú ý:</strong>
                Lựa chọn <strong>[Từ chối báo cáo]</strong> sẽ khóa vĩnh viễn báo cáo này thành trạng thái <span className="text-rose-600 font-bold">Bị từ chối (TU_CHOI)</span> và gửi mail thông báo.
                Lựa chọn <strong>[Yêu cầu kiểm tra lại]</strong> sẽ giữ nguyên trạng thái bài nộp, gắn log review Chờ kiểm tra và gửi yêu cầu thẩm định đến Giảng viên phụ trách.
              </div>

              {/* Input 1: Violation Type Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="viol-type" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Loại vi phạm quy chế *
                </Label>
                <select
                  id="viol-type"
                  value={violationType}
                  onChange={e => setViolationType(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white text-xs font-bold focus:ring-1 focus:ring-rose-500 focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                >
                  <option value="DA_VAN">Đạo văn (Plagiarism Alert)</option>
                  <option value="SAI_DE_TAI">Nộp sai đề tài đăng ký</option>
                  <option value="SAI_DINH_DANG">Sai định dạng quy định nghiêm trọng</option>
                  <option value="FILE_LOI">Tệp tin báo cáo bị hỏng / không mở được</option>
                  <option value="KHAC">Khác</option>
                </select>
              </div>

              {/* Input 2: Violation Reason Textarea */}
              <div className="space-y-1.5">
                <Label htmlFor="violation-reason" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Lý do xử lý & Đặc tả lỗi vi phạm *
                </Label>
                <textarea
                  id="violation-reason"
                  rows={4}
                  required
                  placeholder="Mô tả chi tiết bằng tiếng Việt có dấu. Ví dụ: Bài viết trùng 42% tài liệu tham khảo khóa trước tại địa chỉ..."
                  value={violationReasonText}
                  onChange={e => setViolationReasonText(e.target.value)}
                  className="w-full p-3 text-xs font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800"
                />
                <p className="text-[10px] text-slate-400 font-semibold">Lý do xử lý này bắt buộc phải điền để lưu nhật ký vết hệ thống và hiển thị đến giảng viên/sinh viên liên quan.</p>
              </div>

            </div>

            {/* Modal Footer (Realigned with 3 Buttons) */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/20">
              {/* Cancel Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsViolationModalOpen(false)}
                className="rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                Hủy thao tác
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Request Recheck (Blue Button) */}
                <Button
                  type="button"
                  disabled={isSubmittingReviewRequest || isSubmittingViolation}
                  onClick={handleRequestReview}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/15 flex items-center justify-center gap-1.5 h-10 px-4"
                >
                  {isSubmittingReviewRequest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi yêu cầu...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" /> Yêu cầu kiểm tra lại
                    </>
                  )}
                </Button>

                {/* Reject (Red Button) */}
                <Button
                  type="button"
                  disabled={isSubmittingViolation || isSubmittingReviewRequest}
                  onClick={handleConfirmViolation}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/15 flex items-center justify-center gap-1.5 h-10 px-4"
                >
                  {isSubmittingViolation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang ghi nhận...
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="w-3.5 h-3.5" /> Từ chối báo cáo
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DIALOG 2: MODAL XEM CHI TIẾT BÁO CÁO & VI PHẠM (UC-18) */}
      {isDetailModalOpen && selectedSubForDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 text-left">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5.5 h-5.5 text-violet-500 shrink-0" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Báo cáo kiểm định Đạo văn & Chi tiết Submission</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Mã báo cáo: {selectedSubForDetail.id} • Chi tiết thông tin kiểm duyệt</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

              {/* Basic Submission Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thông tin đề tài báo cáo</span>
                  <div className="space-y-1 text-xs">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">{selectedSubForDetail.topicName}</p>
                    <p className="font-semibold text-slate-500 mt-1">Môn học: {selectedSubForDetail.courseName}</p>
                    <p className="font-semibold text-slate-500">Lớp học phần: {selectedSubForDetail.classCode}</p>
                    <p className="font-semibold text-slate-500">Học kỳ: {selectedSubForDetail.semesterName}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thông tin nộp bài & hướng dẫn</span>
                  <div className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <p>MSSV / Nhóm: <strong className="text-slate-800 dark:text-slate-100">{selectedSubForDetail.groupId}</strong></p>
                    <p>Sinh viên nộp: {selectedSubForDetail.studentName} ({selectedSubForDetail.studentId})</p>
                    <p>Giảng viên phụ trách: {selectedSubForDetail.teacherName}</p>
                    <p className="border-t border-slate-200/50 dark:border-slate-800/50 pt-1.5 mt-1.5">
                      Hạn nộp quy định: {new Date(selectedSubForDetail.deadlineAt).toLocaleString('vi-VN')}
                    </p>
                    {selectedSubForDetail.submittedAt && (
                      <p className="text-violet-600 font-bold">Thời gian nộp bài: {new Date(selectedSubForDetail.submittedAt).toLocaleString('vi-VN')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Plagiarism Similarity Analysis */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Báo cáo phân tích Đạo văn</span>

                <div className="p-5 border border-slate-100 dark:border-slate-850 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Tỷ lệ tương đồng nội dung tổng quát</div>
                    <p className="text-[10px] text-slate-400 font-semibold">EduGrade Pro Similarity Engine tự động kiểm tra trùng khớp khóa.</p>
                  </div>

                  <div className="flex items-center gap-4.5">
                    <div className="text-center">
                      <div className={`text-3xl font-black ${selectedSubForDetail.plagiarismScore > PLAGIARISM_THRESHOLD
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-green-600 dark:text-green-400'
                        }`}>
                        {selectedSubForDetail.plagiarismScore}%
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Trùng khớp</span>
                    </div>
                    <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800" />
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${selectedSubForDetail.plagiarismScore > PLAGIARISM_THRESHOLD
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20'
                        : 'bg-green-50 text-green-700 dark:bg-green-950/20'
                        }`}>
                        {selectedSubForDetail.plagiarismScore > PLAGIARISM_THRESHOLD ? 'Vượt ngưỡng an toàn' : 'Trong ngưỡng an toàn'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Matched sources */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Nguồn đối chiếu trùng khớp:</div>
                  <p className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-400 text-center font-bold rounded-xl text-xs">
                    {selectedSubForDetail.plagiarismScore > 0
                      ? 'Kết quả chi tiết các nguồn đối chiếu tương đồng sẽ hiển thị ở phân hệ báo cáo đạo văn của PDT.'
                      : 'Không phát hiện nguồn trùng khớp đáng nghi vấn.'}
                  </p>
                </div>
              </div>

              {/* Render Warning Review Log (CHO_KIEM_TRA) */}
              {selectedSubForDetail.violationReason && selectedSubForDetail.violationReason.includes('"type":"CHO_KIEM_TRA"') && (
                (() => {
                  let parsedLog: any = {};
                  try {
                    parsedLog = JSON.parse(selectedSubForDetail.violationReason);
                  } catch (e) {
                    parsedLog = null;
                  }
                  if (!parsedLog) return null;

                  return (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 text-xs text-left">
                      <div className="font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-500" /> Cảnh báo vi phạm [Chờ kiểm tra - CHO_KIEM_TRA]:
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-white/40 dark:bg-slate-950/40 p-3 rounded-lg border border-amber-500/10 font-semibold text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                        <div><strong>Loại vi phạm:</strong> {parsedLog.violationType}</div>
                        <div><strong>Người gửi cảnh báo:</strong> {parsedLog.createdBy}</div>
                        <div className="col-span-2"><strong>Thời gian gửi:</strong> {new Date(parsedLog.createdAt).toLocaleString('vi-VN')}</div>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 italic leading-relaxed bg-white/40 dark:bg-slate-950/40 p-3 rounded-lg border border-amber-500/10">
                        "{parsedLog.reason}"
                      </p>
                      <div className="text-[10px] font-semibold text-slate-400">Hệ thống đang chờ Giảng viên phụ trách thẩm định và xác nhận.</div>
                    </div>
                  );
                })()
              )}

              {/* Violation Reason / Rejection Detail */}
              {selectedSubForDetail.status === 'TU_CHOI' && selectedSubForDetail.violationReason && !selectedSubForDetail.violationReason.includes('"type":"CHO_KIEM_TRA"') && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1.5 text-xs text-left">
                  <div className="font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" /> Chi tiết lý do từ chối báo cáo vi phạm:
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 italic leading-relaxed bg-white/40 dark:bg-slate-950/40 p-3 rounded-lg border border-rose-500/10">
                    "{selectedSubForDetail.violationReason}"
                  </p>
                  <div className="text-[10px] font-semibold text-slate-400">Quyết định ban hành bởi: Ban quản lý hệ thống (Admin)</div>
                </div>
              )}

              {/* Edit Note if Teacher requested revision */}
              {selectedSubForDetail.status === 'YEU_CAU_SUA' && selectedSubForDetail.editNote && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1.5 text-xs text-left">
                  <div className="font-black text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500" /> Nội dung yêu cầu sửa từ Giảng viên hướng dẫn:
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 italic leading-relaxed bg-white/40 dark:bg-slate-950/40 p-3 rounded-lg border border-blue-500/10">
                    "{selectedSubForDetail.editNote}"
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-950/20">
              <Button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl px-6 h-10"
              >
                Đóng hộp thoại
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
