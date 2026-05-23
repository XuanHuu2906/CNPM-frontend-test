import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCcw,
  Search,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { academicService } from '../../services/academicService';

export default function GradingReopenRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Status filter
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'all'>('PENDING');

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await academicService.getGradingReopenRequests({
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setRequests(data);
    } catch (err: any) {
      toast.error('Lỗi tải danh sách yêu cầu mở lại: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      await academicService.approveGradingReopenRequest(id, 'Phòng Đào tạo đã duyệt');
      toast.success('Đã duyệt yêu cầu thành công!');
      fetchRequests();
    } catch (err: any) {
      toast.error('Lỗi khi duyệt: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    if (!selectedRequestId) return;

    try {
      setActionLoading(true);
      await academicService.rejectGradingReopenRequest(selectedRequestId, rejectReason);
      toast.success('Đã từ chối yêu cầu!');
      setShowRejectModal(false);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      toast.error('Lỗi khi từ chối: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg border bg-amber-50 text-amber-600 border-amber-100">Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-100">Đã duyệt</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg border bg-rose-50 text-rose-600 border-rose-100">Từ chối</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg border">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Yêu cầu mở lại chấm điểm <RefreshCcw className="w-8 h-8 text-indigo-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Xử lý các yêu cầu mở lại báo cáo đã chấm xong từ giảng viên.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white dark:bg-slate-900 border px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-5">
        <div className="flex flex-wrap gap-2 mb-6">
          {(['PENDING', 'APPROVED', 'REJECTED', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab === 'PENDING' ? 'Chờ duyệt' : tab === 'APPROVED' ? 'Đã duyệt' : tab === 'REJECTED' ? 'Từ chối' : 'Tất cả'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-bold border border-dashed rounded-xl">
            Không có yêu cầu nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Giảng viên / Lớp</th>
                  <th className="pb-3">Bài báo cáo</th>
                  <th className="pb-3">Lý do yêu cầu</th>
                  <th className="pb-3">Thời gian</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3 pr-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-all text-xs">
                    <td className="py-3.5 pl-2">
                      <p className="font-extrabold text-slate-800">{req.teacher?.user?.fullName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{req.submission?.group?.class?.classCode}</p>
                    </td>
                    <td className="py-3.5">
                      <p className="font-bold text-slate-800 line-clamp-1">{req.submission?.group?.topicName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">SV: {req.submission?.student?.user?.fullName || req.submission?.group?.name}</p>
                    </td>
                    <td className="py-3.5 max-w-[200px]">
                      <p className="text-slate-600 line-clamp-2" title={req.reason}>{req.reason}</p>
                      {req.reviewNote && (
                        <p className="text-[10px] text-indigo-600 mt-1 font-semibold italic">Phản hồi: {req.reviewNote}</p>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-500 font-semibold">
                      {new Date(req.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      {req.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoading}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors"
                            title="Duyệt yêu cầu"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequestId(req.id);
                              setShowRejectModal(true);
                            }}
                            disabled={actionLoading}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 text-left">
            <h3 className="text-lg font-black text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Từ chối yêu cầu mở lại
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lý do từ chối (bắt buộc)</label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-bold border rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
