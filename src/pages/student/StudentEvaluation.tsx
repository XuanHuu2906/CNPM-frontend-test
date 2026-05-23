import { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronRight,
  User,
  FileDown,
  Award,
  Send,
  Loader2,
  BookOpen,
  AlertTriangle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { studentService } from '../../services/studentService';
import { useProfile } from '../../hooks/useProfile';
import type { SubmissionDetail } from '../../types';

export default function StudentEvaluation() {
  const { data: profile, isPending: profileLoading } = useProfile();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!profile || profile.role !== 'SINH_VIEN') return;

      const subData: SubmissionDetail = await studentService.getMySubmission();
      setSubmission(subData);


    } catch (error) {
      console.error('Lỗi tải dữ liệu đánh giá:', error);
      setError('Không thể tải dữ liệu đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (profileLoading || loading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Đang tải bảng điểm học tập...</p>
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

  const studentName = profile?.fullName || 'Sinh viên';
  const studentCode = profile?.student?.studentCode || 'N/A';
  const advisorName = profile?.student?.class?.assignments?.[0]?.teacher?.user?.fullName || 'PGS.TS Nguyễn Văn A';



  // STATE 1: No submission or CHUA_NOP
  if (!submission || submission.status === 'CHUA_NOP') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div className="h-[60vh] w-full flex flex-col items-center justify-center text-center gap-4 border border-dashed rounded-3xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 p-8">
          <BookOpen className="w-12 h-12 text-slate-400 animate-pulse" />
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Chưa nộp bài báo cáo</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
            Bạn chưa thực hiện nộp bài báo cáo môn học, do đó hội đồng chưa có cơ sở để thực hiện đánh giá điểm số.
          </p>
        </div>
      </div>
    );
  }

  // STATE 2: YEU_CAU_SUA — show edit request notes, no grades
  if (submission.status === 'YEU_CAU_SUA') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div className="h-[60vh] w-full flex flex-col items-center justify-center text-center gap-4 border border-dashed rounded-3xl border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10 p-8">
          <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Yêu cầu chỉnh sửa báo cáo</h3>
          <p className="text-sm font-medium text-slate-500 max-w-md leading-relaxed">
            Giảng viên yêu cầu bạn chỉnh sửa báo cáo trước khi hoàn tất đánh giá.
          </p>
          {submission.editRequestNote && (
            <div className="mt-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/50 max-w-lg shadow-sm">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nội dung cần chỉnh sửa:</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">"{submission.editRequestNote}"</p>
            </div>
          )}
          <p className="text-xs text-slate-400 font-semibold mt-2">
            Vui lòng vào mục Nộp báo cáo để tải lên bản chỉnh sửa.
          </p>
        </div>
      </div>
    );
  }

  // STATE 3: TU_CHOI — show rejection reason, no grades
  if (submission.status === 'TU_CHOI') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div className="h-[60vh] w-full flex flex-col items-center justify-center text-center gap-4 border border-dashed rounded-3xl border-rose-300 dark:border-rose-900/70 bg-rose-100/50 dark:bg-rose-950/20 p-8">
          <AlertTriangle className="w-12 h-12 text-rose-600" />
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Báo cáo bị từ chối</h3>
          {submission.rejectReason && (
            <div className="mt-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/50 max-w-lg shadow-sm">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Lý do từ chối:</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">"{submission.rejectReason}"</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // STATE 4: DA_CHAM or CHO_DUYET — grades exist but not yet approved, don't show
  if (submission.status === 'DA_CHAM' || submission.status === 'CHO_DUYET') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 text-left max-w-5xl mx-auto">
        <div className="h-[60vh] w-full flex flex-col items-center justify-center text-center gap-4 border border-dashed rounded-3xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 p-8">
          <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
            {submission.status === 'CHO_DUYET' ? 'Kết quả chờ phê duyệt' : 'Đang chờ xử lý'}
          </h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
            {submission.status === 'CHO_DUYET'
              ? 'Kết quả chưa được phê duyệt. Điểm sẽ được hiển thị sau khi Phòng Đào tạo phê duyệt chính thức.'
              : 'Bài nộp của bạn đã được chấm điểm và đang chuyển sang bước phê duyệt. Vui lòng chờ kết quả chính thức.'}
          </p>
        </div>
      </div>
    );
  }

  // STATE 5 (Final): HOAN_THANH — show grades. If DA_NOP or DANG_CHAM, hide old grades.
  const latestGrade = submission?.grades?.[0];

  if (submission.status === 'DA_NOP' || submission.status === 'DANG_CHAM' || !latestGrade) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 text-left max-w-5xl mx-auto">
        <div className="h-[50vh] w-full flex flex-col items-center justify-center text-center gap-4 border border-dashed rounded-3xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 p-8">
          <Award className="w-12 h-12 text-slate-400 animate-bounce" />
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Đang kiểm duyệt và chấm điểm</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
            Bài nộp của bạn đang trong tiến trình kiểm duyệt. Sau khi giảng viên hướng dẫn nhập điểm chi tiết và chốt sổ, kết quả điểm số sẽ tự động xuất hiện tại đây.
          </p>
        </div>
      </div>
    );
  }

  let scoresMap: Record<string, number> = {};
  if (latestGrade.detailedScores) {
    try {
      const parsedScores = JSON.parse(latestGrade.detailedScores);
      // Backend stores detailedScores as an array of { criteriaId: string, score: number }
      if (Array.isArray(parsedScores)) {
        parsedScores.forEach((item: any) => {
          if (item.criteriaId) {
            scoresMap[item.criteriaId] = item.score;
          }
        });
      } else {
        scoresMap = parsedScores; // Fallback in case it's actually a map
      }
    } catch (e) {
      console.error('Failed to parse detailed scores JSON:', e);
    }
  }

  const criteriaList = latestGrade.rubric?.criteria || [];
  const rubricData = criteriaList.map((criterion: any, idx: number) => {
    const rawScore = scoresMap[criterion.id] ?? 0;
    return {
      id: criterion.id,
      title: `${idx + 1}. ${criterion.name}`,
      desc: criterion.description || 'Không có mô tả chi tiết.',
      weight: `${parseFloat(String(criterion.weight))}%`,
      score: `${rawScore.toFixed(1)} / ${parseFloat(String(criterion.maxScore)).toFixed(1)}`,
      comment: 'Chấm điểm bởi giảng viên.'
    };
  });

  const finalScore = typeof latestGrade.finalScore === 'number' ? latestGrade.finalScore : parseFloat(latestGrade.finalScore);

  const getClassification = (score: number) => {
    if (score >= 9.0) return 'Xuất sắc';
    if (score >= 8.0) return 'Giỏi';
    if (score >= 6.5) return 'Khá';
    if (score >= 5.0) return 'Trung bình';
    return 'Yếu';
  };

  const getClassificationColor = (score: number) => {
    if (score >= 8.0) return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';
    if (score >= 6.5) return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50';
    if (score >= 5.0) return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50';
    return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-100 dark:border-rose-900/50';
  };

  const getStrokeColor = (score: number) => {
    if (score >= 8.0) return 'stroke-emerald-500';
    if (score >= 6.5) return 'stroke-indigo-500';
    if (score >= 5.0) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  const strokeDashoffset = 440 - (finalScore / 10) * 440;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">

      {/* HEADER ROW WITH BREADCRUMBS & ACTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            <span>Chi tiết đánh giá</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-600 dark:text-indigo-400">Kết quả điểm số</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Kết quả Đánh giá Điểm số
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" /> Sinh viên: <span className="font-bold text-slate-700 dark:text-slate-300">{studentName} (MSSV: {studentCode})</span>
            </span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden sm:inline" />
            <span>Giảng viên hướng dẫn: <span className="font-bold text-slate-700 dark:text-slate-300">{advisorName}</span></span>
          </div>
        </div>
      </div>

      {/* CONTENT ROW */}
      <div className="space-y-8 max-w-5xl mx-auto">

        {/* Score Dial Summary Card */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-100/50 dark:shadow-none rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-8">
          <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="14"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                className={getStrokeColor(finalScore)}
                strokeWidth="14"
                fill="none"
                strokeDasharray="440"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-black text-slate-800 dark:text-slate-100 block tracking-tight">{finalScore.toFixed(1)}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Tổng điểm</span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-4">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2.5">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getClassificationColor(finalScore)}`}>
                <Award className="w-3.5 h-3.5" />
                Xếp loại: {getClassification(finalScore)}
              </span>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full uppercase">
                Hệ 10
              </span>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
              Kết quả đánh giá dựa trên bộ tiêu chí chuẩn của Rubric được phê duyệt. Điểm số đã được xác nhận bởi thành viên Hội đồng khoa học.
            </p>

            <div className="text-xs text-slate-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800 inline-block">
              Đã chấm điểm lúc: {new Date(latestGrade.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>
        </Card>

        {/* Detailed Rubric Card */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-100/50 dark:shadow-none rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Chi tiết Rubric Đánh giá</CardTitle>
            <span className="text-xs font-bold py-1 px-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 rounded-full">
              Trọng số 100%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/25">
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest w-[45%]">Tiêu chí đánh giá</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center w-[15%]">Trọng số</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center w-[15%]">Điểm đạt</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest w-[25%]">Nhận xét của Giảng viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {rubricData.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all">
                    <td className="py-5 px-6">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{row.title}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{row.desc}</p>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className="text-sm font-bold text-slate-500">{row.weight}</span>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{row.score}</span>
                    </td>
                    <td className="py-5 px-6">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                        "{latestGrade.feedback || 'Không có ghi chú thêm.'}"
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
