import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ChevronRight,
  AlertCircle,
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  FileArchive,
  Save,
  Send,
  Loader2,
  History,
  AlertTriangle
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { studentService } from '../../services/studentService';
import { resubmissionRequestService, type ResubmissionRequest } from '../../services/resubmissionRequestService';
import { useProfile } from '../../hooks/useProfile';
import type { SubmissionDetail } from '../../types';

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  isUploading: boolean;
  type: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  isMain: boolean;
  fullPath: string;
}

let fileIdCounter = 0;
const nextFileId = () => `file-${++fileIdCounter}-${Date.now()}`;

const ALLOWED_MAIN_FORMATS = ['pdf', 'docx'];

export default function StudentSubmit() {
  const { data: profile, isPending: profileLoading } = useProfile();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resubmission Request State
  const [pendingRequest, setPendingRequest] = useState<ResubmissionRequest | null>(null);
  const [latestRequest, setLatestRequest] = useState<ResubmissionRequest | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const uploadFileToServer = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResult = await studentService.uploadFile(formData, (progress) => {
        setUploadingFiles(prev =>
          prev.map(f => (f.id === file.name ? { ...f, progress: Math.min(progress, 99) } : f))
        );
      });
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const isPdf = fileExt === 'pdf';

      const actualSize = uploadResult.size ? parseFloat((uploadResult.size / (1024 * 1024)).toFixed(2)) : parseFloat((file.size / (1024 * 1024)).toFixed(2));
      const hasMain = uploadedFiles.some(f => f.isMain);

      setUploadedFiles(current => [
        ...current,
        {
          id: nextFileId(),
          name: uploadResult.name || file.name,
          size: actualSize,
          type: fileExt,
          isMain: (isPdf || fileExt === 'docx') && !hasMain,
          fullPath: uploadResult.url
        }
      ]);
      setUploadingFiles(curr => curr.filter(f => f.id !== file.name));
      toast.success(`Đã tải lên tệp ${file.name} thành công!`);
    } catch (error) {
      console.error('Lỗi tải tệp lên server:', error);
      setUploadingFiles(curr => curr.filter(f => f.id !== file.name));
      toast.error(`Tải tệp ${file.name} thất bại!`);
    }
  };

  const loadSubmission = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!profile) return;

      const subData: SubmissionDetail = await studentService.getMySubmission();
      setSubmission(subData);

      if (subData) {
        const files: UploadedFile[] = [];
        if (subData.filePath) {
          files.push({
            id: nextFileId(),
            name: subData.filePath.split('/').pop() || subData.filePath,
            size: 0,
            type: 'pdf',
            isMain: true,
            fullPath: subData.filePath
          });
        }
        if (subData.attachments && Array.isArray(subData.attachments)) {
          subData.attachments.forEach((att: string) => {
            files.push({
              id: nextFileId(),
              name: att.split('/').pop() || att,
              size: 0,
              type: att.endsWith('.zip') ? 'zip' : att.endsWith('.pdf') ? 'pdf' : 'other',
              isMain: false,
              fullPath: att
            });
          });
        }

        // Tải bản nháp từ localStorage nếu đang ở trạng thái cho phép nộp
        if (subData.status === 'CHUA_NOP' || subData.status === 'YEU_CAU_SUA') {
          const draftStr = localStorage.getItem(`student-draft-files-${profile.id}`);
          if (draftStr) {
            try {
              const draftFiles = JSON.parse(draftStr);
              if (Array.isArray(draftFiles) && draftFiles.length > 0) {
                setUploadedFiles(draftFiles);
                return;
              }
            } catch (err) {
              console.error('Lỗi đọc bản nháp:', err);
            }
          }
        }

        // Tải trạng thái yêu cầu nộp lại (nếu có)
        try {
          const requests = await resubmissionRequestService.getMyRequests();
          const subRequests = requests.filter(r => r.submissionId === subData.id);
          if (subRequests.length > 0) {
            subRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const latest = subRequests[0];
            setLatestRequest(latest);
            if (latest.status === 'CHO_XU_LY') {
              setPendingRequest(latest);
            } else {
              setPendingRequest(null);
            }
          } else {
            setLatestRequest(null);
            setPendingRequest(null);
          }
        } catch (err) {
          console.error("Lỗi lấy danh sách yêu cầu nộp lại:", err);
        }

        setUploadedFiles(files);
      }
    } catch (error) {
      console.error('Lỗi tải thông tin bài nộp:', error);
      setError('Không thể tải thông tin bài nộp. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const isSemesterLocked = profile?.student?.class?.term?.isLocked ?? false;
  const currentStatus = submission?.status || 'CHUA_NOP';
  const isActionDisabled = isSemesterLocked || (currentStatus !== 'CHUA_NOP' && currentStatus !== 'YEU_CAU_SUA');

  const onDrop = (acceptedFiles: File[]) => {
    if (isActionDisabled) {
      toast.error('Học kỳ bị khóa hoặc trạng thái hiện tại không cho phép sửa bài!');
      return;
    }
    acceptedFiles.forEach(file => {
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > 50) {
        toast.error(`File ${file.name} vượt quá dung lượng cho phép (50MB)!`);
        return;
      }

      const fileType = file.name.split('.').pop() || '';
      const newUpload: UploadingFile = {
        id: file.name,
        name: file.name,
        size: parseFloat(sizeInMB.toFixed(1)),
        progress: 10,
        isUploading: true,
        type: fileType
      };

      setUploadingFiles(prev => [...prev, newUpload]);
      uploadFileToServer(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const handleDeleteUploaded = (id: string) => {
    if (isActionDisabled) {
      toast.error('Trạng thái hiện tại không cho phép sửa bài!');
      return;
    }
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDeleteUploading = (id: string) => {
    if (isActionDisabled) {
      toast.error('Trạng thái hiện tại không cho phép sửa bài!');
      return;
    }
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (isActionDisabled) {
      toast.error('Trạng thái hiện tại không cho phép nộp bài!');
      return;
    }

    // currentStatus check removed as it's handled by isActionDisabled

    if (uploadedFiles.length === 0) {
      toast.warning('Vui lòng tải lên ít nhất một tài liệu báo cáo!');
      return;
    }

    const mainFile = uploadedFiles.find(f => f.isMain) || uploadedFiles.find(f => ALLOWED_MAIN_FORMATS.includes(f.type));
    if (!mainFile) {
      toast.error('Vui lòng tải lên báo cáo chính định dạng PDF hoặc DOCX!');
      return;
    }

    const mainFilePath = mainFile.fullPath;
    const otherAttachments = uploadedFiles
      .filter(f => f.fullPath !== mainFilePath)
      .map(f => f.fullPath);

    try {
      setIsSubmitting(true);
      await studentService.submitReport({
        filePath: mainFilePath,
        attachments: otherAttachments,
        classId: profile?.student?.classId
      });

      toast.success('Nộp báo cáo thành công! Bài nộp đã được chuyển tới Giảng viên hướng dẫn.');

      if (profile?.id) {
        localStorage.removeItem(`student-draft-files-${profile.id}`);
      }

      loadSubmission();
    } catch (error: any) {
      console.error('Lỗi nộp bài:', error);
      const msg = error.response?.data?.message || 'Nộp báo cáo thất bại. Vui lòng thử lại!';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (isActionDisabled) {
      toast.error('Trạng thái hiện tại không cho phép sửa bài!');
      return;
    }
    if (profile?.id) {
      localStorage.setItem(`student-draft-files-${profile.id}`, JSON.stringify(uploadedFiles));
      toast.success('Đã lưu nháp tiến trình nộp bài thành công vào bộ nhớ trình duyệt!');
    } else {
      toast.error('Không thể lưu nháp do chưa nhận diện được Sinh viên.');
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestReason.trim()) {
      toast.warning('Vui lòng nhập lý do xin nộp lại!');
      return;
    }
    if (!submission?.id) return;

    try {
      setIsRequesting(true);
      const req = await resubmissionRequestService.createRequest(submission.id, requestReason);
      setPendingRequest(req);
      toast.success('Gửi yêu cầu xin nộp lại thành công!');
      setIsRequestModalOpen(false);
      setRequestReason('');
    } catch (error: any) {
      console.error('Lỗi gửi yêu cầu nộp lại:', error);
      toast.error(error.response?.data?.message || 'Gửi yêu cầu thất bại.');
    } finally {
      setIsRequesting(false);
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Đang tải biểu mẫu nộp bài...</p>
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

  const advisorName = profile?.student?.class?.assignments?.[0]?.teacher?.user?.fullName || 'Chưa phân công';
  const termName = profile?.student?.class?.term?.name || '2024';

  const getDeadlineString = () => {
    if (!profile?.student?.class?.term?.endDate) return '23:59, 15/05/2024';
    return '23:59, ' + new Date(profile.student.class.term.endDate).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const status = submission?.status || 'CHUA_NOP';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">

      {/* HEADER WITH BREADCRUMBS & DEADLINE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            <span>Danh sách đề tài</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-600 dark:text-indigo-400">Báo cáo Môn học / Đồ án</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Khu vực nộp báo cáo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            Đồ án / Báo cáo môn học {termName} - Ngành Kỹ thuật Phần mềm
          </p>
        </div>

        {/* Deadline Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-full text-xs font-bold shrink-0 self-start md:self-auto shadow-sm">
          <AlertCircle className="w-4 h-4 animate-pulse text-rose-500" />
          Hạn nộp: {getDeadlineString()}
        </span>
      </div>

      {/* WARNING BANNER: FEEDBACK FROM INSTRUCTOR */}
      {(status === 'YEU_CAU_SUA' || status === 'TU_CHOI') && (
        <Card className="border-l-4 border-l-rose-500 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 rounded-2xl relative overflow-hidden">
          <div className="flex gap-4">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  {status === 'TU_CHOI' ? 'Yêu cầu bị từ chối bởi Giảng viên' : 'Yêu cầu chỉnh sửa từ Giảng viên'}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Giảng viên HD: {advisorName}</p>
              </div>

              <div className="relative p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="absolute top-1 right-3 text-6xl text-slate-200 dark:text-slate-800/50 font-serif leading-none select-none">”</span>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed pr-6 italic">
                  {submission?.editRequestNote || submission?.rejectReason || 'Không có mô tả yêu cầu cụ thể.'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* PENDING REQUEST BANNER */}
      {pendingRequest && (
        <Card className="border-l-4 border-l-amber-500 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 rounded-2xl relative overflow-hidden">
          <div className="flex gap-4">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-xl shrink-0">
              <History className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  Yêu cầu xin nộp lại đang chờ duyệt
                </h3>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                  Đã gửi lúc: {new Date(pendingRequest.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="relative p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span className="font-bold">Lý do:</span> {pendingRequest.reason}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* REJECTED REQUEST BANNER */}
      {latestRequest && latestRequest.status === 'TU_CHOI' && (
        <Card className="border-l-4 border-l-rose-500 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 rounded-2xl relative overflow-hidden">
          <div className="flex gap-4">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl shrink-0">
              <X className="w-5 h-5 text-rose-500" />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  Yêu cầu xin nộp lại báo cáo bị từ chối
                </h3>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                  Đã từ chối bởi Giảng viên
                </p>
              </div>
              <div className="relative p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span className="font-bold">Lý do xin nộp lại của bạn:</span> {latestRequest.reason}
                </p>
                <p className="text-sm font-medium text-rose-600 dark:text-rose-500">
                  <span className="font-bold">Nhận xét của Giảng viên:</span> {latestRequest.feedbackNote || 'Không có nhận xét chi tiết.'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TWO COLUMN CONTENT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left column: Drag and Drop zone (Takes 7/12 width) */}
        <div className="lg:col-span-7 h-full flex">
          <div
            {...getRootProps()}
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 min-h-[380px] bg-white dark:bg-slate-900 ${isActionDisabled
              ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 opacity-60 cursor-not-allowed pointer-events-none'
              : isDragActive
                ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 scale-[0.99] cursor-pointer'
                : 'border-indigo-200 dark:border-indigo-950 hover:border-indigo-400 dark:hover:border-indigo-800 shadow-lg shadow-slate-100/50 dark:shadow-none cursor-pointer'
              }`}
          >
            <input {...getInputProps()} disabled={isActionDisabled} />

            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mb-6 border border-indigo-100/50 dark:border-indigo-900/50 text-indigo-500 shadow-inner">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Kéo thả tệp vào đây</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm mb-6 leading-relaxed">
              hoặc click để duyệt tệp từ máy tính. Hỗ trợ định dạng <span className="font-semibold text-indigo-500">PDF, ZIP, DOCX</span>.
            </p>

            <div className="flex gap-4 items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-950 py-2.5 px-6 rounded-full border border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-rose-400" /> PDF</span>
              <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
              <span className="flex items-center gap-1"><FileArchive className="w-3.5 h-3.5 text-amber-400" /> ZIP</span>
              <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
              <span className="text-slate-500">Tối đa 50MB</span>
            </div>
          </div>
        </div>

        {/* Right column: Attached files (Takes 5/12 width) */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-100/50 dark:shadow-none rounded-2xl p-6 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Tệp đính kèm</CardTitle>
              <span className="text-xs font-bold py-1 px-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 rounded-full">
                {uploadedFiles.length + uploadingFiles.length} Tệp
              </span>
            </div>

            <div className="space-y-5 mt-4">
              {/* UPLOADING BLOCK */}
              {uploadingFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang tải lên</p>
                  {uploadingFiles.map((file) => (
                    <div key={file.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between gap-3 relative overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5 text-left">
                        <div className="flex items-center justify-between text-xs">
                          <p className="font-bold text-slate-700 dark:text-slate-300 truncate pr-4">{file.name}</p>
                          <span className="text-slate-400 font-bold shrink-0">{parseFloat((file.size * (file.progress / 100)).toFixed(1))}MB / {file.size}MB</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUploading(file.id)}
                        className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* UPLOADED BLOCK */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đã tải lên</p>
                {uploadedFiles.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm font-medium border border-dashed rounded-xl border-slate-100 dark:border-slate-800">
                    Chưa có tệp nào được tải lên.
                  </div>
                ) : (
                  uploadedFiles.map((file) => {
                    const isPdf = file.type === 'pdf';
                    return (
                      <div key={file.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between gap-3 group">
                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${isPdf ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                          {isPdf ? <FileText className="w-5 h-5" /> : <FileArchive className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pr-2">{file.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {file.size > 0 && (
                              <>
                                <span className="text-[10px] text-slate-400 font-bold">{file.size} MB</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              </>
                            )}
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Sẵn sàng
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteUploaded(file.id)}
                          className="p-1 rounded-full text-slate-300 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 group-hover:text-slate-400 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Action Row inside Card */}
          <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            {currentStatus === 'DA_NOP' && !pendingRequest ? (
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 rounded-xl font-bold text-sm transition-all shadow-sm"
              >
                <History className="w-4 h-4" />
                Yêu cầu nộp lại báo cáo
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={isActionDisabled}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border rounded-xl font-bold text-sm transition-all ${isActionDisabled
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98] text-slate-700 dark:text-slate-300'
                    }`}
                >
                  <Save className="w-4 h-4" />
                  Lưu nháp
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isActionDisabled || isSubmitting || pendingRequest !== null}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md ${isActionDisabled || pendingRequest !== null
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-indigo-600/15'
                    }`}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Nộp báo cáo
                </button>
              </>
            )}
          </div>
        </Card>

      </div>

      {/* SUBMISSION HISTORY LOGS */}
      {submission?.statusLogs && submission.statusLogs.length > 0 && (
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-100/50 dark:shadow-none rounded-2xl p-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Lịch sử nộp & phê duyệt báo cáo</CardTitle>
          </div>

          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 pl-6 space-y-6">
            {submission.statusLogs.map((log: any, idx: number) => {
              const dateStr = new Date(log.createdAt).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });

              const getStatusStyles = (status: string) => {
                switch (status) {
                  case 'CHUA_NOP':
                    return { text: 'Chưa nộp', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-500', dot: 'bg-slate-400' };
                  case 'DA_NOP':
                    return { text: 'Đã nộp báo cáo', bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40', dot: 'bg-blue-500' };
                  case 'DANG_CHAM':
                    return { text: 'Đang chấm điểm', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40', dot: 'bg-amber-500' };
                  case 'YEU_CAU_SUA':
                    return { text: 'Yêu cầu sửa đổi', bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40', dot: 'bg-rose-500 animate-pulse' };
                  case 'TU_CHOI':
                    return { text: 'Từ chối báo cáo', bg: 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400', dot: 'bg-rose-600' };
                  case 'DA_CHAM':
                    return { text: 'Đã chấm điểm xong', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40', dot: 'bg-emerald-500' };
                  case 'CHO_DUYET':
                    return { text: 'Chờ duyệt', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40', dot: 'bg-amber-500' };
                  case 'HOAN_THANH':
                    return { text: 'Hồ sơ hoàn tất', bg: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40', dot: 'bg-violet-500' };
                  default:
                    return { text: status, bg: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' };
                }
              };

              const styles = getStatusStyles(log.newStatus);

              return (
                <div key={log.id || idx} className="relative group text-left">
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-sm z-10 transition-transform duration-200 group-hover:scale-125 ${styles.dot}`} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/40 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all">
                    <div className="space-y-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${styles.bg}`}>
                          {styles.text}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          {dateStr}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {log.note || 'Cập nhật tiến trình báo cáo hệ thống'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* REQUEST MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Yêu cầu xin nộp lại</h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-left">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Bài báo cáo của bạn đã được nộp. Nếu bạn phát hiện nộp sai tệp hoặc thiếu sót quan trọng, bạn có thể gửi yêu cầu xin giảng viên mở lại quyền nộp bài.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Lý do xin nộp lại <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể..."
                  className="w-full h-32 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-700 dark:text-slate-300 resize-none transition-all"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={isRequesting || !requestReason.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20"
              >
                {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
