import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  ExternalLink,
  Save,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  Sparkles,
  Calculator,
  MessageSquare,
  HelpCircle,
  Loader2,
  Lock,
  MessageCircle,
  Clock,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { teacherService } from '@/services/teacherService';
import type { Submission, Rubric, Grade } from '@/services/teacherService';
import GradingList from './GradingList';

interface EvaluationItem {
  id: string; // criteria ID
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  score: number;
  comment: string;
}

export default function GradingWorkshop() {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy dữ liệu bài nộp được truyền từ Dashboard qua state
  const stateData = location.state as {
    submissionId: string;
    groupName: string;
    topic: string;
    members: string[];
    version: number;
    classId: string;
  } | null;

  const { submissionId, groupName, topic, members, classId } = stateData || {
    submissionId: '',
    groupName: '',
    topic: '',
    members: [],
    classId: '',
    version: 1
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // States chứa thông tin liên quan
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubricId, setSelectedRubricId] = useState<string>('');
  const [existingGrade, setExistingGrade] = useState<Grade | null>(null);

  // States quản trị giao diện chấm điểm
  const [gradingItems, setGradingItems] = useState<EvaluationItem[]>([]);
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [finalScore, setFinalScore] = useState(0);

  // States cho Modals phản hồi trạng thái
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [editRequestNote, setEditRequestNote] = useState('');
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationReason, setViolationReason] = useState('');

  // States cho Yêu cầu mở lại chấm điểm
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenLoading, setReopenLoading] = useState(false);
  const [hasSentReopenRequest, setHasSentReopenRequest] = useState(false);

  // States cho Xác nhận nộp điểm
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [confirmSubmitChecked, setConfirmSubmitChecked] = useState(false);

  // Tải toàn bộ thông tin ban đầu (Bài nộp chi tiết, Rubrics, và Kết quả điểm cũ nếu có)
  const loadInitialData = async () => {
    try {
      setLoading(true);
      // 1. Tải chi tiết bài nộp (để có link file)
      const subData = await teacherService.getSubmissionById(submissionId) as any;
      setSubmission(subData);

      // 2. Tải toàn bộ danh sách rubrics của giảng viên
      const rubricsData = await teacherService.getRubrics();
      setRubrics(rubricsData);

      // 3. Tải kết quả chấm điểm nếu có
      try {
        const gradeData = await teacherService.getGradeBySubmissionId(submissionId);
        setExistingGrade(gradeData);
        setSelectedRubricId(gradeData.rubricId);
        setGeneralFeedback(gradeData.feedback || '');

        // Ánh xạ điểm chi tiết lên rubrics
        const rubric = rubricsData.find(r => r.id === gradeData.rubricId);
        if (rubric) {
          const items = rubric.criteria.map(c => {
            const match = gradeData.detailedScores.find((ds: any) => ds.criteriaId === c.id);
            return {
              id: c.id!,
              name: c.name,
              description: c.description || '',
              weight: c.weight,
              maxScore: c.maxScore,
              score: match ? Number(match.score) : 0,
              comment: match ? (match.note || '') : '',
            };
          });
          setGradingItems(items);
        }
      } catch (gradeErr: any) {
        // 404 là chưa được chấm điểm, nạp danh sách tiêu chí rỗng hoặc lấy rubric đầu tiên
        if (gradeErr.response?.status === 404) {
          if (rubricsData.length > 0) {
            setSelectedRubricId(rubricsData[0].id);
          }
        } else {
          toast.error("Lỗi khi tải thông tin điểm chấm trước đó.");
        }
      }

    } catch (err) {
      toast.error("Không thể tải thông tin phòng chấm điểm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionId) {
      loadInitialData();
    }
  }, [submissionId]);

  // Đồng bộ hóa tiêu chí chấm khi Giảng viên chuyển đổi mẫu Rubric (chỉ áp dụng khi chưa chấm hoàn thành)
  useEffect(() => {
    if (!selectedRubricId || existingGrade) return;
    const rubric = rubrics.find(r => r.id === selectedRubricId);
    if (rubric) {
      const items = rubric.criteria.map(c => ({
        id: c.id!,
        name: c.name,
        description: c.description || '',
        weight: c.weight,
        maxScore: c.maxScore,
        score: 0,
        comment: '',
      }));
      setGradingItems(items);
    }
  }, [selectedRubricId, rubrics, existingGrade]);

  // Tính toán Live Final Score quy đổi theo trọng số %
  useEffect(() => {
    const total = gradingItems.reduce((sum, item) => sum + (item.score * (item.weight / 100)), 0);
    setFinalScore(Number(total.toFixed(2)));
  }, [gradingItems]);

  const handleScoreChange = (id: string, newScore: number) => {
    if (newScore < 0 || newScore > 10) {
      toast.error('Điểm số phải nằm trong khoảng từ 0 đến 10!');
      return;
    }
    setGradingItems(gradingItems.map(item => item.id === id ? { ...item, score: newScore } : item));
  };

  const handleCommentChange = (id: string, text: string) => {
    setGradingItems(gradingItems.map(item => item.id === id ? { ...item, comment: text } : item));
  };

  // Lưu bảng điểm (Chấm điểm mới hoặc cập nhật điểm cũ kèm check OCC)
  const handleSaveGrade = async (completeSubmission = false) => {
    if (!selectedRubricId) {
      toast.error("Vui lòng thiết lập hoặc chọn bảng Rubric chấm điểm trước!");
      return;
    }

    try {
      setSaving(true);
      const detailedScores = gradingItems.map(item => ({
        criteriaId: item.id,
        score: item.score,
        note: item.comment,
      }));

      // Gọi API gửi điểm số
      await teacherService.submitGrade(submissionId, {
        rubricId: selectedRubricId,
        detailedScores,
        feedback: generalFeedback,
        version: existingGrade ? existingGrade.version : 1, // Gửi phiên bản điểm hiện tại lên check OCC
        isDraft: !completeSubmission,
      });

      // Nếu chỉ lưu nháp
      if (!completeSubmission) {
        toast.success("Đã lưu bảng điểm số thành công!");
        await loadInitialData(); // Reload để nhận version điểm mới nhất
      } else {
        toast.success(`Đã chấm điểm thành công bài nộp môn học với điểm số: ${finalScore}!`);
        navigate('/teacher/dashboard');
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Xử lý Xung đột đồng thời OCC
        triggerConflictError();
      } else {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật điểm số.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Gửi yêu cầu sửa đổi (Trả về YEU_CAU_SUA kèm OCC)
  const handleSendEditRequest = async () => {
    if (!editRequestNote.trim()) {
      toast.error('Vui lòng nhập nội dung yêu cầu sinh viên chỉnh sửa!');
      return;
    }

    try {
      setActionLoading(true);
      await teacherService.updateSubmissionStatus(submissionId, {
        status: 'YEU_CAU_SUA',
        editRequestNote: editRequestNote,
        note: `Yêu cầu sửa đổi báo cáo từ giảng viên: ${editRequestNote}`,
        version: submission ? submission.version : 1,
      });
      toast.warning(`Đã gửi yêu cầu chỉnh sửa và chuyển bài nộp sang trạng thái Yêu cầu sửa.`);
      setShowEditRequestModal(false);
      navigate('/teacher/dashboard');
    } catch (err: any) {
      if (err.response?.status === 409) {
        triggerConflictError();
      } else {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Từ chối bài nộp vi phạm quy chế (Từ chối TU_CHOI kèm OCC)
  const handleSendViolation = async () => {
    if (!violationReason.trim()) {
      toast.error('Vui lòng viết rõ lý do từ chối bài nộp!');
      return;
    }

    try {
      setActionLoading(true);
      await teacherService.updateSubmissionStatus(submissionId, {
        status: 'TU_CHOI',
        rejectReason: violationReason,
        note: `Bài nộp bị từ chối do vi phạm: ${violationReason}`,
        version: submission ? submission.version : 1,
      });
      toast.error(`Bài nộp đã bị từ chối thành công.`);
      setShowViolationModal(false);
      navigate('/teacher/dashboard');
    } catch (err: any) {
      if (err.response?.status === 409) {
        triggerConflictError();
      } else {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
      }
    } finally {
      setActionLoading(false);
    }
  };



  // Gửi yêu cầu mở lại chấm điểm
  const handleSendReopenRequest = async () => {
    if (reopenReason.trim().length < 10) {
      toast.error('Lý do phải có ít nhất 10 ký tự!');
      return;
    }
    try {
      setReopenLoading(true);
      await teacherService.createReopenRequest(submissionId, reopenReason);
      toast.success('Đã gửi yêu cầu mở lại chấm điểm tới Phòng Đào tạo.');
      setShowReopenModal(false);
      setReopenReason('');
      setHasSentReopenRequest(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu.');
    } finally {
      setReopenLoading(false);
    }
  };



  const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000/${path.replace(/\\/g, '/')}`; // Hỗ trợ dev local
  };

  const isReadOnly = stateData?.readOnly === true ||
    (submission && ['DA_CHAM', 'CHO_DUYET', 'HOAN_THANH'].includes(submission.status));

  if (!stateData) {
    return <GradingList />;
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold">Đang liên kết nạp thông tin phòng chấm điểm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-120px)] flex flex-col">

      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          title="Quay lại"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-left flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-100 dark:border-violet-900">
            {groupName}
          </span>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 truncate mt-1 tracking-tight">
            Phòng chấm điểm trực quan: {topic}
          </h1>
        </div>
      </div>

      {/* CORE DUAL-PANEL CONTENT */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">

        {/* LEFT PANEL: Document view & details */}
        <div className="flex-1 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Tài liệu báo cáo chính của sinh viên</span>
            </div>
            {submission?.filePath && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">v{submission.version}.pdf</span>
                <a
                  href={getFileUrl(submission.filePath)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-lg block"
                  title="Tải tệp chính xuống"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* PDF/REPORT CONTAINER */}
          <div className="flex-1 p-8 overflow-y-auto bg-slate-100/50 dark:bg-slate-950/20 flex flex-col items-center justify-center space-y-4">
            <div className="w-full max-w-lg p-10 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xl rounded-2xl text-left space-y-6">
              <div className="pb-6 border-b border-slate-100 dark:border-slate-800 text-center">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">TÊN ĐỀ TÀI: {topic}</h2>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-2 uppercase tracking-wider">{groupName}</p>
                <p className="text-xs text-slate-400 font-bold mt-1">Lớp Học phần: {classId}</p>
              </div>

              <div className="space-y-4 text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Danh sách sinh viên nộp bài:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {members.map((m, idx) => (
                    <li key={idx} className="font-semibold text-slate-700 dark:text-slate-300">{m}</li>
                  ))}
                </ul>

                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-4">Tệp đính kèm phụ (Attachments):</h3>
                {submission?.attachments && submission.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {(Array.isArray(submission.attachments) ? submission.attachments : String(submission.attachments).split(',')).filter(Boolean).map((att: string, idx: number) => (
                      <a
                        key={idx}
                        href={getFileUrl(att)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 rounded-lg text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <BookOpen className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="truncate flex-1 font-semibold">{att.split('/').pop()}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic font-normal">Không có tệp đính kèm phụ.</p>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tình trạng bài nộp: {submission?.status}</span>
                {submission?.filePath && (
                  <a
                    href={getFileUrl(submission.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold"
                  >
                    Xem báo cáo toàn văn
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Grading with Rubrics or Discussions */}
        <div className="w-full lg:w-[480px] border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl flex flex-col overflow-hidden shrink-0">

          <div className="flex-1 overflow-y-auto p-5 text-left">
            <div className="space-y-6 animate-in fade-in duration-200">

                {/* Rubric Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Chọn bảng Rubric chấm điểm</label>
                  <select
                    value={selectedRubricId}
                    onChange={(e) => {
                      if (existingGrade) {
                        toast.warning("Báo cáo này đã được áp dụng bảng Rubric cố định và lưu điểm trước đó. Không thể thay đổi.");
                        return;
                      }
                      setSelectedRubricId(e.target.value);
                    }}
                    disabled={!!existingGrade || isReadOnly}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 dark:text-slate-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn bảng Rubric phù hợp --</option>
                    {rubrics.map(r => (
                      <option key={r.id} value={r.id}>{r.title} ({r.criteria.length} tiêu chí)</option>
                    ))}
                  </select>
                </div>

                {/* FINAL LIVE SCORE STATUS */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-between shadow-lg shadow-indigo-500/10">
                  <div className="space-y-1 text-left">
                    <h3 className="font-bold text-sm flex items-center gap-1.5">
                      <Calculator className="w-5 h-5" />
                      Điểm Số Đồng Bộ
                    </h3>
                    <p className="text-[10px] text-indigo-100 font-medium">Tự động cộng dồn theo tỉ lệ phần trăm</p>
                  </div>
                  <div className="text-center bg-white/15 px-4 py-2 rounded-xl border border-white/20">
                    <span className="text-2xl font-black leading-none">{finalScore}</span>
                    <span className="text-[10px] font-bold block mt-0.5 text-indigo-200">Quy đổi 10</span>
                  </div>
                </div>

                {/* CRITERIA INPUT SCROLL AREA */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiêu chí chi tiết từ Rubric</h4>

                  {gradingItems.length > 0 ? (
                    gradingItems.map((item) => (
                      <div key={item.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 bg-slate-50/20 dark:bg-slate-900/10">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-0.5 text-left">
                            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.name}</h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{item.description}</p>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg shrink-0">
                            {item.weight}%
                          </span>
                        </div>

                        {/* Slide score config */}
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={item.score}
                            onChange={(e) => handleScoreChange(item.id, Number(e.target.value))}
                            disabled={isReadOnly}
                            className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={item.score}
                            onChange={(e) => handleScoreChange(item.id, Number(e.target.value))}
                            disabled={isReadOnly}
                            className="w-14 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-black text-center text-indigo-600 dark:text-indigo-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Feedback text input */}
                        <div className="relative">
                          <input
                            type="text"
                            value={item.comment}
                            placeholder="Nhận xét tóm tắt của phần này..."
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                            disabled={isReadOnly}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-[11px] focus:outline-none text-slate-600 dark:text-slate-400 disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 font-semibold text-xs border border-dashed rounded-xl">
                      Vui lòng lựa chọn một bảng Rubric ở trên để nạp khung điểm chấm.
                    </div>
                  )}
                </div>

                {/* GENERAL FEEDBACK */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nhận xét tổng hợp của Giảng viên</label>
                  <textarea
                    rows={3}
                    value={generalFeedback}
                    onChange={(e) => setGeneralFeedback(e.target.value)}
                    placeholder="Nhập nhận xét tổng quan về chất lượng đồ án, báo cáo..."
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
          </div>
          {/* ACTION BUTTON PANEL */}
          {!isReadOnly ? (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
              <button
                onClick={() => handleSaveGrade(false)}
                disabled={saving || !selectedRubricId}
                className="flex items-center justify-center gap-1.5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu bản nháp điểm
              </button>
              <button
                onClick={() => {
                  setConfirmSubmitChecked(false);
                  setShowConfirmSubmitModal(true);
                }}
                disabled={saving || !selectedRubricId}
                className="flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Chấp nhận & Gửi đi
              </button>
              <button
                onClick={() => setShowEditRequestModal(true)}
                disabled={actionLoading}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold transition-all text-xs border bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 text-rose-500 border-rose-100/60 dark:border-rose-900/40"
              >
                <AlertTriangle className="w-4 h-4" />
                Yêu cầu sửa (Edit)
              </button>
              <button
                onClick={() => setShowViolationModal(true)}
                disabled={actionLoading}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold transition-all text-xs border bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/10 dark:hover:bg-slate-950/20 text-slate-500 border-slate-200 dark:border-slate-800"
              >
                <XCircle className="w-4 h-4" />
                Từ chối bài nộp
              </button>
            </div>
          ) : (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm font-semibold shrink-0">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Bài nộp ở chế độ chỉ đọc. Không thể chỉnh sửa điểm số.
              </div>
              {['DA_CHAM', 'CHO_DUYET'].includes(submission?.status || '') && (
                (() => {
                  // Check if there is an existing pending request from the backend or newly sent
                  const isPending = hasSentReopenRequest || submission?.reopenRequests?.some((req: any) => req.status === 'PENDING');
                  if (isPending) {
                    return (
                      <span className="px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold dark:bg-emerald-950/20 dark:border-emerald-900/50">
                        Đã gửi yêu cầu
                      </span>
                    );
                  }
                  return (
                    <button
                      onClick={() => setShowReopenModal(true)}
                      className="px-4 py-2 border border-amber-200 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50 dark:hover:bg-amber-900/30"
                    >
                      Yêu cầu mở lại chấm điểm
                    </button>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>

      {/* EDIT REQUEST MODAL */}
      {showEditRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Yêu cầu chỉnh sửa báo cáo
            </h3>
            <p className="text-xs text-slate-500 font-semibold">Bài báo cáo của sinh viên sẽ lập tức quay trở lại trạng thái "Yêu cầu sửa". Sinh viên sẽ được thông báo tự động.</p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mô tả lý do & chỉ dẫn sửa bài</label>
              <textarea
                rows={4}
                value={editRequestNote}
                onChange={(e) => setEditRequestNote(e.target.value)}
                placeholder="Nhập yêu cầu sửa đổi chi tiết tại đây..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEditRequestModal(false)}
                className="px-4 py-2 text-xs font-bold border rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSendEditRequest}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md flex items-center gap-1"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIOLATION/REJECT MODAL */}
      {showViolationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Từ chối bài nộp (Vi phạm)
            </h3>
            <p className="text-xs text-slate-500 font-semibold">Chỉ áp dụng khi bài nộp vi phạm nghiêm trọng quy chế đạo văn hoặc nộp rác. Bài nộp sẽ chuyển về trạng thái "Từ chối".</p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lý do từ chối cụ thể</label>
              <textarea
                rows={4}
                value={violationReason}
                onChange={(e) => setViolationReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowViolationModal(false)}
                className="px-4 py-2 text-xs font-bold border rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSendViolation}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold bg-slate-950 text-white rounded-xl shadow-md flex items-center gap-1"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SUBMIT MODAL */}
      {showConfirmSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Xác nhận hoàn tất chấm điểm
            </h3>
            <p className="text-xs text-slate-500 font-semibold">Sau khi hoàn tất, báo cáo sẽ chuyển sang trạng thái Đã chấm/Chờ duyệt và bạn không thể tự ý thay đổi điểm số được nữa.</p>

            <div className="flex items-start gap-3 mt-4 bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <input
                type="checkbox"
                id="confirmSubmitCheck"
                checked={confirmSubmitChecked}
                onChange={(e) => setConfirmSubmitChecked(e.target.checked)}
                className="mt-1 shrink-0 cursor-pointer w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="confirmSubmitCheck" className="text-xs text-indigo-900 dark:text-indigo-300 font-semibold cursor-pointer select-none">
                Tôi đã kiểm tra đầy đủ điểm số, nhận xét và xác nhận hoàn tất việc chấm điểm cho bài báo cáo này.
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmSubmitModal(false)}
                className="px-4 py-2 text-xs font-bold border rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmitModal(false);
                  handleSaveGrade(true);
                }}
                disabled={!confirmSubmitChecked || saving}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận nộp điểm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REOPEN REQUEST MODAL */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Yêu cầu mở lại chấm điểm
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Gửi yêu cầu tới Phòng Đào tạo để xin phép mở lại quyền chấm điểm cho báo cáo này.
              Vui lòng nêu rõ lý do (nhập sai điểm, chấm nhầm, v.v.).
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lý do yêu cầu (tối thiểu 10 ký tự)</label>
              <textarea
                rows={4}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Tôi lỡ tay nhập nhầm điểm ở tiêu chí số 2..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2 text-xs font-bold border rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSendReopenRequest}
                disabled={reopenLoading || reopenReason.trim().length < 10}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reopenLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
