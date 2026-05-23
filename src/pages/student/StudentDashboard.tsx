import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import {
  AlertTriangle,
  Calendar,
  Clock,
  History,
  FileUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Award,
  Bell
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { studentService } from '../../services/studentService';
import type { StudentProfile, SubmissionDetail, NotificationItem, GroupDetail } from '../../types';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { data: profile, isPending: profileLoading } = useProfile();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== 'SINH_VIEN') {
      navigate('/');
      return;
    }

    const loadSecondaryData = async () => {
      try {
        setError(null);
        const groupId = profile.student?.groupId;

        const promises: Promise<any>[] = [];
        if (groupId) {
          promises.push(studentService.getGroup(groupId).then(setGroup));
        }
        promises.push(
          studentService.getMySubmission().then(setSubmission)
        );

        await Promise.all(promises);
      } catch (error) {
        console.error('Lỗi tải dữ liệu dashboard sinh viên:', error);
        setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.');
      } finally {
        setLoading(false);
      }
    };

    loadSecondaryData();
  }, [profile, navigate]);

  if (profileLoading || loading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Đang tải dữ liệu đồ án...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center text-center gap-4 p-8">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Có lỗi xảy ra</h3>
        <p className="text-sm font-medium text-slate-500 max-w-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'HD';
    const parts = name.split(' ');
    const last = parts[parts.length - 1];
    return last ? last.substring(0, 2).toUpperCase() : 'HD';
  };

  const advisorName = profile?.student?.class?.assignments?.[0]?.teacher?.user?.fullName || 'Chưa phân công';
  const termName = profile?.student?.class?.term?.name || '2024';
  const classCode = profile?.student?.class?.classCode || 'Chưa xếp lớp';

  const getDaysRemaining = () => {
    if (!profile?.student?.class?.term?.endDate) return 0;
    const end = new Date(profile.student.class.term.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getDeadlineString = () => {
    if (!profile?.student?.class?.term?.endDate) return 'Chưa có hạn';
    return new Date(profile.student.class.term.endDate).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const status = submission?.status || 'CHUA_NOP';

  const getStatusLabelVN = () => {
    switch (status) {
      case 'CHUA_NOP': return 'Chưa nộp';
      case 'DA_NOP': return 'Đã nộp';
      case 'DANG_CHAM': return 'Đang chấm';
      case 'YEU_CAU_SUA': return 'Yêu cầu sửa';
      case 'TU_CHOI': return 'Từ chối';
      case 'DA_CHAM': return 'Đã chấm';
      case 'CHO_DUYET': return 'Chờ duyệt';
      case 'HOAN_THANH': return 'Hoàn thành';
      default: return 'Chưa nộp';
    }
  };

  const steps = [
    { label: 'Chưa nộp' },
    { label: 'Đã nộp' },
    { label: 'Đang chấm' },
    { label: 'Yêu cầu sửa' },
    { label: 'Đã chấm' },
    { label: 'Chờ duyệt' },
    { label: 'Hoàn thành' }
  ];

  const getStepState = (stepLabel: string) => {
    const statusOrder: Record<string, number> = {
      'CHUA_NOP': 0,
      'DA_NOP': 1,
      'DANG_CHAM': 2,
      'YEU_CAU_SUA': 3,
      'DA_CHAM': 4,
      'CHO_DUYET': 5,
      'HOAN_THANH': 6
    };

    if (status === 'TU_CHOI') {
      if (stepLabel === 'Yêu cầu sửa') return 'error';
      return 'pending';
    }

    const currentOrder = statusOrder[status] ?? 0;

    if (stepLabel === 'Chưa nộp') return 'completed';
    if (stepLabel === 'Đã nộp') return currentOrder >= 1 ? 'completed' : 'pending';
    if (stepLabel === 'Đang chấm') return currentOrder >= 2 ? 'completed' : 'pending';
    if (stepLabel === 'Yêu cầu sửa') {
      if (status === 'YEU_CAU_SUA') return 'error';
      return currentOrder >= 3 ? 'completed' : 'pending';
    }
    if (stepLabel === 'Đã chấm') return currentOrder >= 4 ? 'completed' : 'pending';
    if (stepLabel === 'Chờ duyệt') return currentOrder >= 5 ? 'completed' : 'pending';
    if (stepLabel === 'Hoàn thành') return currentOrder >= 6 ? 'completed' : 'pending';
    return 'pending';
  };

  const getStepDate = (stepLabel: string) => {
    if (!submission?.statusLogs) {
      if (stepLabel === 'Chưa nộp' && profile?.student?.class?.term?.startDate) {
        return new Date(profile.student.class.term.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      }
      return '';
    }
    const logs = submission.statusLogs;
    let log = null;

    if (stepLabel === 'Chưa nộp' && profile?.student?.class?.term?.startDate) {
      return new Date(profile.student.class.term.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }

    if (stepLabel === 'Đã nộp') {
      log = logs.find((l: any) => l.newStatus === 'DA_NOP');
    } else if (stepLabel === 'Đang chấm') {
      log = logs.find((l: any) => l.newStatus === 'DANG_CHAM');
    } else if (stepLabel === 'Yêu cầu sửa') {
      log = logs.find((l: any) => l.newStatus === 'YEU_CAU_SUA' || l.newStatus === 'TU_CHOI');
    } else if (stepLabel === 'Đã chấm') {
      log = logs.find((l: any) => l.newStatus === 'DA_CHAM');
    } else if (stepLabel === 'Chờ duyệt') {
      log = logs.find((l: any) => l.newStatus === 'CHO_DUYET');
    } else if (stepLabel === 'Hoàn thành') {
      log = logs.find((l: any) => l.newStatus === 'HOAN_THANH');
    }

    if (log) {
      return new Date(log.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
    return '';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* GREETING BANNER */}
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-slate-800 dark:text-slate-100">
          Xin chào, {profile?.fullName || 'Sinh viên'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Theo dõi tiến độ và quản lý báo cáo môn học của bạn.
        </p>
      </div>

      {/* TOP SECTION: Project details */}
      <div className="w-full">

        {/* Project Info & Deadline Gauge (Takes full width) */}
        <Card className="w-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-100/50 dark:shadow-none rounded-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Left part: project text */}
          <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-100 dark:border-violet-900">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                Học kỳ: {termName}
              </span>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4 leading-snug tracking-tight">
                {group?.topicName || 'Chưa đăng ký đề tài nghiên cứu'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Mã nhóm</p>
                <span className="inline-block mt-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300">
                  {group?.name || 'Cá nhân'}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Lớp học phần</p>
                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{classCode}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center font-bold text-orange-600 dark:text-orange-400 shadow-sm text-sm">
                {getInitials(advisorName)}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Giảng viên hướng dẫn</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{advisorName}</p>
              </div>
            </div>
          </div>

          {/* Right part: visual vertical deadline card */}
          <div className="w-full md:w-64 bg-gradient-to-b from-indigo-600 to-indigo-700 text-white p-8 flex flex-col justify-between items-center text-center shrink-0">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Clock className="w-6 h-6 text-white" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-200/90">Hạn nộp báo cáo</p>
              <div className="flex items-baseline justify-center">
                <span className="text-6xl font-black tracking-tight">{getDaysRemaining()}</span>
                <span className="text-lg font-bold ml-1 text-indigo-100">Ngày</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '75%' }} />
              </div>
              <p className="text-xs font-semibold text-indigo-100">Hạn chốt: {getDeadlineString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* BOTTOM SECTION: TIMELINE STEPPER & ACTION CARD */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-100/50 dark:shadow-none rounded-2xl p-8 space-y-8">

        {/* Card Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Tiến trình nộp & chấm điểm</h3>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-wider">
              Trạng thái hiện tại: {getStatusLabelVN()}
            </p>
          </div>
          <button
            onClick={() => navigate('/student/evaluation')}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
          >
            <History className="w-4 h-4" />
            Lịch sử & Phiếu điểm
          </button>
        </div>

        {/* Horizontal Timeline Stepper */}
        <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[800px] flex items-center justify-between relative pt-4">

            {/* Absolute Connecting Background Line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 z-0" />

            {/* Stepper Node List */}
            {steps.map((step, idx) => {
              const stepState = getStepState(step.label);
              const isCompleted = stepState === 'completed';
              const isError = stepState === 'error';
              const stepDate = getStepDate(step.label);

              return (
                <div key={idx} className="flex flex-col items-center relative z-10 w-24">
                  {/* Circle Step indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 ring-8 ring-white dark:ring-slate-900 transition-all duration-300 ${isCompleted
                    ? 'bg-indigo-600 border-indigo-200 dark:border-indigo-950 text-white'
                    : isError
                      ? 'bg-rose-500 border-rose-100 dark:border-rose-950 text-white animate-pulse'
                      : 'bg-slate-200 border-slate-100 dark:bg-slate-800 dark:border-slate-900 text-slate-400'
                    }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    ) : isError ? (
                      <XCircle className="w-4 h-4 text-white shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full" />
                    )}
                  </div>

                  {/* Labels */}
                  <div className="text-center mt-3">
                    <p className={`text-xs font-bold tracking-tight whitespace-nowrap ${isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : isError
                        ? 'text-rose-500 font-extrabold'
                        : 'text-slate-400'
                      }`}>
                      {step.label}
                    </p>
                    {stepDate && (
                      <span className="text-[10px] text-muted-foreground font-semibold block mt-0.5">
                        {stepDate}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CONDITIONAL BOXES FROM REAL DATABASE STATUS */}
        {status === 'CHUA_NOP' && (
          <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 rounded-xl shrink-0">
                <FileUp className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Chưa nộp bài báo cáo môn học</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Hệ thống đang mở cho lớp phần mềm của bạn. Hãy hoàn thiện báo cáo và nộp bài trước ngày {getDeadlineString()}.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/submit')}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all text-sm shrink-0"
            >
              <FileUp className="w-4 h-4" />
              Nộp báo cáo ngay
            </button>
          </div>
        )}

        {status === 'DA_NOP' && (
          <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Bài báo cáo đã được nộp thành công</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Tệp tin của bạn hiện đang ở trạng thái an toàn. Bạn có thể nộp đè tệp mới để sửa đổi trước khi giảng viên chấm bài.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/submit')}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all text-sm shrink-0"
            >
              <FileUp className="w-4 h-4" />
              Xem bài nộp
            </button>
          </div>
        )}

        {status === 'DANG_CHAM' && (
          <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-xl shrink-0">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Giảng viên đang tiến hành đánh giá</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Bài làm của bạn đang được chấm điểm bởi giảng viên hướng dẫn và hội đồng khoa học. Vui lòng kiên nhẫn chờ đợi.
                </p>
              </div>
            </div>
            <button
              disabled
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-sm shrink-0 cursor-not-allowed"
            >
              <Clock className="w-4 h-4" />
              Đang chấm bài...
            </button>
          </div>
        )}

        {status === 'YEU_CAU_SUA' && (
          <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/40 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500 animate-bounce" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Cần cập nhật bổ sung bài báo cáo</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Ý kiến nhận xét: <span className="italic">"{submission?.editRequestNote || 'Không có ghi chú cụ thể. Vui lòng liên hệ giảng viên.'}"</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/submit')}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 transition-all text-sm shrink-0"
            >
              <FileUp className="w-4 h-4" />
              Nộp lại bản sửa
            </button>
          </div>
        )}

        {status === 'TU_CHOI' && (
          <div className="p-6 rounded-2xl bg-rose-100/50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex gap-4">
              <div className="p-3 bg-rose-200 dark:bg-rose-950/50 rounded-xl shrink-0">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Bài báo cáo bị từ chối</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Lý do: <span className="italic">"{submission?.rejectReason || 'Không có ghi chú cụ thể.'}"</span>
                </p>
                <p className="text-xs text-slate-500 font-semibold mt-2">
                  {getDaysRemaining() > 0 ? 'Nếu còn thời hạn, bạn có thể nộp lại báo cáo.' : 'Đã hết thời hạn nộp bổ sung.'}
                </p>
              </div>
            </div>
            {getDaysRemaining() > 0 && (
              <button
                onClick={() => navigate('/student/submit')}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 transition-all text-sm shrink-0"
              >
                <FileUp className="w-4 h-4" />
                Nộp lại bản sửa
              </button>
            )}
          </div>
        )}

        {status === 'DA_CHAM' && (
          <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Đã chấm điểm xong</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Giảng viên đã hoàn tất chấm điểm. Kết quả đang chờ Phòng Đào tạo phê duyệt.
                </p>
              </div>
            </div>
            <button
              disabled
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-sm shrink-0 cursor-not-allowed"
            >
              <Clock className="w-4 h-4" />
              Chờ phê duyệt
            </button>
          </div>
        )}

        {status === 'CHO_DUYET' && (
          <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-xl shrink-0">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Kết quả chờ phê duyệt</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Điểm số đã được giảng viên nhập và đang chờ Phòng Đào tạo phê duyệt chính thức.
                </p>
              </div>
            </div>
            <button
              disabled
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-sm shrink-0 cursor-not-allowed"
            >
              <Clock className="w-4 h-4" />
              Đang chờ duyệt
            </button>
          </div>
        )}

        {status === 'HOAN_THANH' && (
          <div className="p-6 rounded-2xl bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex gap-4">
              <div className="p-3 bg-teal-100 dark:bg-teal-950/40 rounded-xl shrink-0">
                <Award className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Hoàn thành đánh giá học tập</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Bài báo cáo của bạn đã được nhập điểm chính thức lên hệ thống đào tạo. Bạn có thể xem bảng điểm Rubric và lời phê chi tiết.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/evaluation')}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 transition-all text-sm shrink-0"
            >
              <History className="w-4 h-4" />
              Xem kết quả điểm
            </button>
          </div>
        )}

      </Card>

    </div>
  );
}
