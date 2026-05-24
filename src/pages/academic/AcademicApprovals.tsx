import { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  User, 
  GraduationCap, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Send,
  MessageSquare,
  Sparkles,
  BookOpen,
  PieChart as PieIcon,
  ChevronRight,
  ChevronLeft,
  Download,
  ShieldCheck,
  Ban,
  ExternalLink,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { academicService } from '../../services/academicService';

interface TopicReport {
  id: string;
  groupName: string;
  topicName: string;
  members: string[];
  score: number | null; 
  plagiarismRate: number; 
  comments: string; 
  status: 'CHO_DUYET' | 'HOAN_THANH' | 'DANG_CHAM';
  rubricBreakdown: { name: string; weight: number; score: number | null; comment: string }[];
  version: number;
  fileUrl: string;
}

interface ClassApproval {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  department: string;
  avgScore: number;
  overallFeedback: string;
  reports: TopicReport[];
}

export default function AcademicApprovals() {
  const [pendingClasses, setPendingClasses] = useState<ClassApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quản lý lớp được chọn dựa vào ID lớp học phần thay vì Index
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  // Trạng thái cho Đề tài / Báo cáo đang được chọn xem chi tiết Rubric
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Pagination cho danh sách lớp bên trái (Left Class List)
  const [classPage, setClassPage] = useState(1);
  const classesPerPage = 3; 

  // Pagination cho danh sách đề tài ở giữa (Middle Reports List)
  const [reportPage, setReportPage] = useState(1);
  const reportsPerPage = 3; 

  // Modal từ chối phê duyệt (Reject)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [targetRejectReportId, setTargetRejectReportId] = useState<string | null>(null);

  // Tải dữ liệu từ Backend
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [classesData, subsData] = await Promise.all([
        academicService.getAllClasses(),
        academicService.getAllSubmissions()
      ]);

      const mapped: ClassApproval[] = classesData.map((cls: any) => {
        // Lọc bài nộp thuộc lớp này
        const classSubs = subsData.filter((sub: any) => {
          const sClassId = sub.group?.classId || (sub.student?.enrollments?.some((e: any) => e.classId === cls.id) ? cls.id : null);
          return sClassId === cls.id;
        });

        const reports: TopicReport[] = classSubs.map((sub: any, idx: number) => {
          const groupName = sub.group?.name || `Sinh viên: ${sub.student?.user?.fullName || 'Cá nhân'}`;
          const topicName = sub.group?.topicName || sub.topicName || 'Đề tài môn học';
          const members = sub.group 
            ? (sub.group.students?.map((s: any) => s.user?.fullName) || [])
            : [sub.student?.user?.fullName || 'N/A'];

          const grade = sub.grades && sub.grades.length > 0 ? sub.grades[0] : null;
          const isApproved = grade?.isApproved || false;
          // Trạng thái: HOAN_THANH (PDT đã duyệt), CHO_DUYET (GV đã chấm, chờ duyệt), DANG_CHAM (chưa chấm hoặc bị trả về)
          const status: 'DANG_CHAM' | 'CHO_DUYET' | 'HOAN_THANH' = isApproved ? 'HOAN_THANH' : (grade ? 'CHO_DUYET' : 'DANG_CHAM');

          // Đọc phân rã Rubric từ detailedScores
          const rubricBreakdown = grade?.rubric?.criteria?.map((crit: any) => {
            let detailedScores = grade.detailedScores || [];
            if (typeof detailedScores === 'string') {
              try {
                detailedScores = JSON.parse(detailedScores);
              } catch (e) {
                detailedScores = [];
              }
            }
            const critScoreObj = detailedScores.find((ds: any) => ds.criteriaId === crit.id);
            return {
              name: crit.criteriaName,
              weight: crit.weight,
              score: critScoreObj ? critScoreObj.score : null,
              comment: critScoreObj?.comment || ''
            };
          }) || [];

          return {
            id: sub.id,
            groupName,
            topicName,
            members,
            score: grade && grade.finalScore != null ? Number(grade.finalScore) : null,
            plagiarismRate: sub.plagiarismRate || 0,
            comments: grade?.feedback || '',
            status,
            rubricBreakdown,
            version: grade?.version || 1,
            fileUrl: sub.fileUrl || ''
          };
        }).filter((r: TopicReport) => r.status !== 'DANG_CHAM');

        // Tính điểm trung bình của các bài đã chấm
        const gradedReports = reports.filter(r => r.score !== null);
        const avgScore = gradedReports.length > 0
          ? Math.round((gradedReports.reduce((sum, r) => sum + (r.score || 0), 0) / gradedReports.length) * 10) / 10
          : 0.0;

        return {
          id: cls.id,
          code: cls.classCode,
          name: cls.subject?.name || 'Môn học',
          lecturer: cls.assignments?.[0]?.teacher?.user?.fullName || 'Chưa phân công',
          department: cls.subject?.subjectCode?.substring(0, 4)?.toUpperCase()?.includes('SE') ? 'Kỹ thuật Phần mềm (CNPM)' : cls.subject?.subjectCode?.substring(0, 4)?.toUpperCase()?.includes('IS') ? 'Hệ thống Thông tin (HTTT)' : 'Kỹ thuật Máy tính (KTMT)',
          avgScore,
          overallFeedback: '',
          reports
        };
      });

      // Lọc ra các lớp có bài nộp
      const withReports = mapped.filter(c => c.reports.length > 0);
      setPendingClasses(withReports);

      if (withReports.length > 0 && !selectedClassId) {
        setSelectedClassId(withReports[0].id);
      }
    } catch (error: any) {
      toast.error(`Không thể tải thông tin phê duyệt: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentClass = pendingClasses.find(c => c.id === selectedClassId) || pendingClasses[0];

  const isBatchApproveEnabled = currentClass && currentClass.reports.length > 0 && 
    currentClass.reports.some(r => r.status === 'CHO_DUYET') &&
    currentClass.reports.every(r => r.status === 'HOAN_THANH' || (r.status === 'CHO_DUYET' && r.score !== null && r.comments && r.rubricBreakdown && r.rubricBreakdown.length > 0 && r.rubricBreakdown.every(b => b.score !== null)));

  const totalClassPages = Math.ceil(pendingClasses.length / classesPerPage);
  const paginatedClasses = pendingClasses.slice(
    (classPage - 1) * classesPerPage,
    classPage * classesPerPage
  );

  const totalReportPages = Math.ceil((currentClass?.reports.length || 0) / reportsPerPage);
  const paginatedReports = (currentClass?.reports || []).slice(
    (reportPage - 1) * reportsPerPage,
    reportPage * reportsPerPage
  );

  // Reset report page và report selected khi đổi lớp học phần
  useEffect(() => {
    setReportPage(1);
    setSelectedReportId(null);
  }, [selectedClassId]);

  const currentReport = 
    currentClass?.reports.find(r => r.id === selectedReportId) || 
    paginatedReports[0] || 
    currentClass?.reports[0];

  // Xử lý Phê duyệt một Đề tài riêng lẻ
  const handleApproveReport = async (reportId: string) => {
    if (!currentClass) return;
    const report = currentClass.reports.find(r => r.id === reportId);
    if (!report) return;

    if (report.score === null) {
      toast.error(
        <div className="text-left font-semibold">
          <p className="text-red-600 dark:text-red-400 font-extrabold flex items-center gap-1">🚨 Không thể phê duyệt!</p>
          <p className="text-xs text-slate-500 mt-1">Bài nộp của {report.groupName} chưa được giảng viên chấm điểm thành phần.</p>
        </div>
      );
      return;
    }

    try {
      toast.loading('Đang tiến hành phê duyệt kết quả điểm...', { id: 'approve-action' });
      await academicService.approveGrade(reportId, { isApproved: true, version: report.version });
      toast.success(`Đã phê duyệt kết quả đề tài "${report.topicName}" thành công!`, { id: 'approve-action' });
      
      loadData();
    } catch (error: any) {
      toast.error(`Phê duyệt thất bại: ${error.message}`, { id: 'approve-action' });
    }
  };

  // Mở modal từ chối
  const handleOpenRejectModal = (reportId: string | null) => {
    setTargetRejectReportId(reportId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Xác nhận từ chối chấm lại (Hủy phê duyệt để GV chấm lại)
  const handleSendReject = async () => {
    if (!currentClass) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng cung cấp lý do cụ thể để giảng viên cập nhật lại!');
      return;
    }

    if (targetRejectReportId) {
      const report = currentClass.reports.find(r => r.id === targetRejectReportId);
      if (!report) return;

      try {
        toast.loading('Đang gửi yêu cầu trả về chấm lại...', { id: 'reject-action' });
        // Gỡ duyệt điểm để GV cập nhật lại
        await academicService.approveGrade(targetRejectReportId, { isApproved: false, version: report.version });
        toast.success(`Đã trả về chấm lại đề tài của ${report.groupName} cho GV. ${currentClass.lecturer}!`, { id: 'reject-action' });
        
        setShowRejectModal(false);
        loadData();
      } catch (error: any) {
        toast.error(`Yêu cầu thất bại: ${error.message}`, { id: 'reject-action' });
      }
    }
  };

  // Phê duyệt nhanh toàn bộ đề tài hợp lệ trong lớp (Batch Approve All)
  const handleBatchApproveAll = async () => {
    if (!currentClass || !isBatchApproveEnabled) return;

    const unassignedOrUnscored = currentClass.reports.filter(r => r.score === null);
    if (unassignedOrUnscored.length > 0) {
      toast.error(
        <div className="text-left font-semibold">
          <p className="text-red-600 dark:text-red-400 font-extrabold flex items-center gap-1">🚨 Chặn Phê duyệt Hàng loạt!</p>
          <p className="text-xs text-slate-500 mt-1">Lớp có {unassignedOrUnscored.length} đề tài chưa chấm xong điểm số. Hãy yêu cầu chấm xong trước.</p>
        </div>
      );
      return;
    }

    try {
      toast.loading('Đang phê duyệt nhanh toàn bộ lớp học phần...', { id: 'batch-approve' });
      
      const toApprove = currentClass.reports.filter(r => r.status === 'CHO_DUYET');
      if (toApprove.length === 0) {
        toast.info('Không có đề tài nào cần phê duyệt bổ sung.', { id: 'batch-approve' });
        return;
      }

      await Promise.all(
        toApprove.map(r => academicService.approveGrade(r.id, { isApproved: true, version: r.version }))
      );

      toast.success(`Đã phê duyệt nhanh ${toApprove.length} kết quả lớp học phần ${currentClass.code} thành công!`, { id: 'batch-approve' });
      loadData();
    } catch (error: any) {
      toast.error(`Duyệt hàng loạt thất bại: ${error.message}`, { id: 'batch-approve' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-120px)] flex flex-col text-left">
      
      {/* HEADER SECTION */}
      <div className="shrink-0">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          Phê duyệt Kết quả Chấm điểm <FileCheck2 className="w-8 h-8 text-indigo-500" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Rà soát kết quả chấm thi, cơ cấu phổ điểm Rubric, tỷ lệ đạo văn Turnitin và phê duyệt chính thức công khai.
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      ) : pendingClasses.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed rounded-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Hoàn tất phê duyệt toàn bộ khoa!</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center font-medium">Hiện không còn lớp học phần hoặc đề tài nào đang ở trạng thái Chờ phê duyệt điểm.</p>
        </div>
      ) : (
        /* DUAL PANEL LAYOUT */
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          
          {/* LEFT PANEL: PENDING CLASS LIST */}
          <div className="w-full lg:w-72 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex flex-col overflow-hidden shrink-0 justify-between">
            <div>
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0 flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang chờ duyệt</span>
                <span className="text-[10px] font-extrabold py-0.5 px-2 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-full">
                  {pendingClasses.length} Lớp
                </span>
              </div>

              <div className="p-3 space-y-2.5">
                {paginatedClasses.map((cls) => {
                  const totalReports = cls.reports.length;
                  const doneReports = cls.reports.filter(r => r.status === 'HOAN_THANH').length;
                  const isSelected = selectedClassId === cls.id;

                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        setSelectedClassId(cls.id);
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/35 dark:bg-indigo-950/15 shadow-sm'
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                          {cls.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-extrabold">
                          {doneReports}/{totalReports} Đề tài
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">
                        {cls.name}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800/50 mt-1">
                        <span className="font-semibold truncate max-w-[100px]">{cls.lecturer}</span>
                        <span className="font-bold text-slate-800 dark:text-white">TB: {cls.avgScore}</span>
                      </div>

                      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-indigo-500" style={{ width: `${(doneReports / totalReports) * 100}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-semibold">Trang {classPage}/{totalClassPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setClassPage(p => Math.max(p - 1, 1))}
                  disabled={classPage === 1}
                  className="p-1 rounded bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setClassPage(p => Math.min(p + 1, totalClassPages))}
                  disabled={classPage === totalClassPages}
                  className="p-1 rounded bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: REPORTS EXPLORER */}
          <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
            
            {/* Core reports list inside the selected class */}
            <div className="flex-1 min-w-0 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex flex-col overflow-hidden justify-between">
              <div>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-left min-w-0 flex-1">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block truncate">{currentClass.code} • {currentClass.department}</span>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white mt-0.5 leading-snug truncate">
                      {currentClass.name}
                    </h2>
                  </div>
                  {isBatchApproveEnabled ? (
                    <button
                      onClick={handleBatchApproveAll}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/15 cursor-pointer shrink-0"
                    >
                      Duyệt nhanh tất cả
                    </button>
                  ) : (
                    <button
                      disabled
                      title="Chỉ khả dụng khi tất cả đề tài đã có điểm, nhận xét, rubric và ở trạng thái Chờ phê duyệt."
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-not-allowed shrink-0"
                    >
                      Duyệt nhanh tất cả
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {paginatedReports.map((report) => {
                    const isSelected = currentReport?.id === report.id;
                    const isInvalid = report.score === null;
                    
                    return (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReportId(report.id)}
                        className={`p-4 border rounded-xl text-left transition-all cursor-pointer flex flex-col gap-3 relative ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50/15 dark:bg-indigo-950/5 shadow-md' 
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50/50'
                        } ${isInvalid ? 'border-rose-100 dark:border-rose-950/20' : ''}`}
                      >
                        {isInvalid && (
                          <div className="bg-rose-500/10 border border-rose-100/50 dark:border-rose-950/20 px-3 py-1.5 text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest rounded-lg flex items-center gap-1.5 shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                            <span className="truncate">Đề tài chưa hoàn tất chấm điểm (Ngoại lệ UC-16)</span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 min-w-0 flex-1">
                            <span className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 truncate">
                              {report.groupName} • {report.members.join(', ')}
                            </span>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-150 leading-tight line-clamp-2">
                              {report.topicName}
                            </h4>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold shrink-0 whitespace-nowrap ${
                            report.status === 'HOAN_THANH' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : report.status === 'DANG_CHAM'
                              ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {report.status === 'HOAN_THANH' ? 'Đã phê duyệt' : report.status === 'DANG_CHAM' ? 'Đang chấm' : 'Chờ phê duyệt'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 mt-1 text-xs">
                          <div className="flex items-center gap-1.5 font-bold min-w-0">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">Độ trùng lặp:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] shrink-0 ${
                              report.plagiarismRate >= 30 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40' 
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40'
                            }`}>
                              {report.plagiarismRate}% Turnitin
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 ml-auto font-black text-sm">
                            {report.score !== null ? (
                              <span>{report.score.toFixed(1)} <span className="text-[10px] text-muted-foreground font-semibold">Điểm</span></span>
                            ) : (
                              <span className="text-rose-500 flex items-center gap-0.5 text-xs">
                                <Ban className="w-3.5 h-3.5" /> Chưa có điểm
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-850">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRejectModal(report.id);
                            }}
                            disabled={report.status === 'HOAN_THANH'}
                            className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                              report.status === 'HOAN_THANH' 
                                ? 'opacity-40 cursor-not-allowed border-slate-100 border-slate-200 dark:border-slate-800' 
                                : 'border-rose-150 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 border-rose-100 dark:border-rose-900/30 cursor-pointer'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Trả về chấm lại
                          </button>
                          {report.score !== null ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveReport(report.id);
                              }}
                              disabled={report.status === 'HOAN_THANH'}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all text-white ${
                                report.status === 'HOAN_THANH' 
                                  ? 'bg-emerald-500/50 cursor-not-allowed' 
                                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer'
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Phê duyệt điểm
                            </button>
                          ) : (
                            <button
                              disabled
                              title="Cần giảng viên hoàn tất chấm điểm trước khi phê duyệt."
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                            >
                              <Ban className="w-3.5 h-3.5 text-slate-400" />
                              Chưa đủ điều kiện phê duyệt
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Hiển thị đề tài {(reportPage - 1) * reportsPerPage + 1} - {Math.min(reportPage * reportsPerPage, currentClass?.reports.length || 0)} trong tổng số {currentClass?.reports.length} nhóm
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReportPage(p => Math.max(p - 1, 1))}
                    disabled={reportPage === 1}
                    className="p-1 rounded bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setReportPage(p => Math.min(p + 1, totalReportPages))}
                    disabled={reportPage === totalReportPages}
                    className="p-1 rounded bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed view of the selected report's rubric */}
            <div className="w-full lg:w-80 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex flex-col overflow-hidden shrink-0">
              {currentReport ? (
                <>
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0 text-left">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{currentReport.groupName}</span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={currentReport.topicName}>
                      {currentReport.topicName}
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6 text-left">
                    {/* Rubric Details */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 pb-1.5 border-b border-slate-50 dark:border-slate-850">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        Điểm thành phần Rubric
                      </h4>

                      <div className="space-y-4">
                        {currentReport.rubricBreakdown.map((rub, idx) => (
                          <div key={idx} className="p-3.5 border border-slate-50 dark:border-slate-850 rounded-xl space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{rub.name}</h5>
                                <p className="text-[10px] text-slate-400 font-semibold">{rub.comment || 'Đã ghi nhận đóng góp tiêu chí.'}</p>
                              </div>
                              <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded shrink-0">
                                {rub.weight}%
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-extrabold">
                                <span className="text-slate-450">Điểm:</span>
                                <span className="text-indigo-600">{rub.score !== null ? `${rub.score} / 10` : '- / 10'}</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(rub.score || 0) * 10}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* General comment */}
                    <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/10 dark:bg-slate-950/10 relative">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        Nhận xét chung của Giảng viên
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        {currentReport.comments ? currentReport.comments : (currentReport.score !== null ? 'Chưa có nhận xét bổ sung từ giảng viên.' : 'Chưa có nhận xét chính thức (Đề tài chưa hoàn tất chấm).')}
                      </p>
                    </div>

                    {/* Plagiarism details warning */}
                    <div className={`p-4 rounded-xl border flex gap-3 ${
                      currentReport.plagiarismRate >= 30 
                        ? 'bg-rose-50/30 border-rose-100 text-rose-700' 
                        : 'bg-emerald-50/30 border-emerald-100 text-emerald-700'
                    }`}>
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <div className="text-xs text-left font-semibold">
                        <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Turnitin Plagiarism Index</h5>
                        <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">
                          {currentReport.plagiarismRate >= 30 
                            ? 'Mức độ trùng lặp vượt ngưỡng cho phép (30%). Phòng Đào tạo lưu ý rà soát kỹ.' 
                            : 'Mức độ trùng lặp nằm trong phạm vi quy chế an toàn cho phép.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex flex-col gap-2 shrink-0">
                    <a
                      href={currentReport.fileUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer border border-slate-200/50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Mở tệp báo cáo
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                  <Info className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold">Hãy chọn một đề tài báo cáo cụ thể ở bên trái để rà soát chi tiết Rubric.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT/REGRADING REASON DIALOG MODAL */}
      {showRejectModal && currentClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left text-slate-800 dark:text-slate-100">
            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Trả về chấm lại kết quả
            </h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Trả về cho giảng viên {currentClass.lecturer} chấm lại hoặc rà soát lại bài nộp. Trạng thái đề tài sẽ được chuyển về <span className="font-bold text-indigo-600">Chờ chấm</span> để giảng viên cập nhật điểm số mới.
            </p>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lý do từ chối cụ thể</label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do chi tiết (ví dụ: Tỷ lệ trùng lặp Turnitin cao vượt quy chuẩn 42%, yêu cầu làm việc với SV)..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-xs font-bold border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSendReject}
                className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
