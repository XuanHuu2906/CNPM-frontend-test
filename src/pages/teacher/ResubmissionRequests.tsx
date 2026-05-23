import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { History, Loader2, CheckCircle2, XCircle, AlertCircle, FileText, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { resubmissionRequestService, type ResubmissionRequest } from '../../services/resubmissionRequestService';

export default function ResubmissionRequests() {
  const [requests, setRequests] = useState<ResubmissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ResubmissionRequest | null>(null);
  const [actionType, setActionType] = useState<'DA_DUYET' | 'TU_CHOI' | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await resubmissionRequestService.getTeacherPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Lỗi tải danh sách yêu cầu:', error);
      toast.error('Không thể tải danh sách yêu cầu xin nộp lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;
    if (actionType === 'TU_CHOI' && !feedbackNote.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối!');
      return;
    }

    try {
      setIsProcessing(true);
      await resubmissionRequestService.updateStatus(selectedRequest.id, actionType, feedbackNote);
      toast.success(actionType === 'DA_DUYET' ? 'Đã duyệt yêu cầu nộp lại.' : 'Đã từ chối yêu cầu.');
      setSelectedRequest(null);
      setActionType(null);
      setFeedbackNote('');
      fetchRequests(); // Tải lại danh sách
    } catch (error: any) {
      console.error('Lỗi xử lý yêu cầu:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Đang tải danh sách yêu cầu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Yêu cầu nộp lại báo cáo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            Quản lý và phê duyệt các yêu cầu xin nộp lại báo cáo từ sinh viên
          </p>
        </div>
      </div>

      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-[60vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Danh sách chờ xử lý ({requests.length})
            </CardTitle>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm mã sinh viên..." 
              className="pl-9 pr-4 py-2 text-sm rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {requests.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Không có yêu cầu nào</h3>
              <p className="text-sm text-slate-500 mt-1">Tất cả yêu cầu đã được xử lý xong.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map(req => (
                <div key={req.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow bg-slate-50/30 dark:bg-slate-900/30 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {req.student?.user.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{req.student?.user.fullName}</h4>
                        <p className="text-xs text-slate-500 font-medium">MSSV: {req.student?.studentCode}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                      {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex-1 bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50 mb-4 text-sm relative">
                    <AlertCircle className="w-4 h-4 text-amber-500 absolute top-4 left-4" />
                    <p className="pl-6 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Lý do: </span> 
                      {req.reason}
                    </p>
                  </div>

                  {req.submission?.filePath && (
                    <div className="flex items-center gap-2 mb-5">
                      <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                      <a 
                        href={req.submission.filePath} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                      >
                        Báo cáo hiện tại (Phiên bản {req.submission.version})
                      </a>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </div>
                  )}

                  <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => { setSelectedRequest(req); setActionType('TU_CHOI'); }}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 transition-colors"
                    >
                      Từ chối
                    </button>
                    <button 
                      onClick={() => { setSelectedRequest(req); setActionType('DA_DUYET'); }}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                      Duyệt cho nộp lại
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ACTION MODAL */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                {actionType === 'DA_DUYET' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {actionType === 'DA_DUYET' 
                  ? 'Sinh viên sẽ được phép tải lên file báo cáo mới. Trạng thái bài nộp sẽ chuyển về "Yêu cầu sửa đổi".'
                  : 'Yêu cầu sẽ bị hủy bỏ, bài nộp hiện tại được giữ nguyên trạng thái ĐÃ NỘP.'
                }
              </p>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Ghi chú phản hồi {actionType === 'TU_CHOI' && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder={actionType === 'DA_DUYET' ? "Có thể để trống..." : "Vui lòng nhập lý do từ chối..."}
                  className="w-full h-32 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-700 dark:text-slate-300 resize-none transition-all"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-end gap-3">
              <button 
                onClick={() => { setSelectedRequest(null); setActionType(null); setFeedbackNote(''); }}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleAction}
                disabled={isProcessing || (actionType === 'TU_CHOI' && !feedbackNote.trim())}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 transition-all flex items-center gap-2 shadow-md ${
                  actionType === 'DA_DUYET' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                }`}
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {actionType === 'DA_DUYET' ? 'Xác nhận duyệt' : 'Từ chối yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
