import { useState, useEffect } from 'react';
import { 
  Calendar, 
  ShieldAlert, 
  Settings, 
  HelpCircle, 
  Plus, 
  Clock, 
  Lock, 
  Unlock,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { academicService } from '../../services/academicService';
import { adminService } from '../../services/adminService';

interface AcademicTerm {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
  status?: 'active' | 'upcoming' | 'archived';
  classesCount?: number;
}

export default function AcademicTerms() {
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Trạng thái modal Tạo học kỳ mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTermName, setNewTermName] = useState('');
  const [newTermStart, setNewTermStart] = useState('');
  const [newTermEnd, setNewTermEnd] = useState('');

  // Cấu hình tham số học tập từ System Configuration API
  const [maxSubmissions, setMaxSubmissions] = useState(5);
  const [plagiarismLimit, setPlagiarismLimit] = useState(20);
  const [rubricStrict, setRubricStrict] = useState(true);

  // Tải danh sách Học kỳ và cấu hình hệ thống thực tế
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [termsData, configsData] = await Promise.all([
        academicService.getAllTerms(),
        adminService.getConfigs()
      ]);

      setTerms(termsData);

      // Trích xuất cấu hình hệ thống học vụ
      const maxSubConfig = configsData.find(c => c.key === 'MAX_SUBMISSIONS');
      if (maxSubConfig) setMaxSubmissions(Number(maxSubConfig.value));

      const plagConfig = configsData.find(c => c.key === 'PLAGIARISM_THRESHOLD');
      if (plagConfig) setPlagiarismLimit(Number(plagConfig.value));

      const strictConfig = configsData.find(c => c.key === 'RUBRIC_STRICT');
      if (strictConfig) setRubricStrict(strictConfig.value === 'true');

    } catch (error: any) {
      toast.error(`Lỗi tải cấu hình học kỳ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Xử lý tạo Học kỳ mới
  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermName || !newTermStart || !newTermEnd) {
      toast.error('Vui lòng điền đầy đủ thông tin Học kỳ mới.');
      return;
    }

    try {
      toast.loading('Đang khởi tạo học kỳ mới...', { id: 'create-term' });
      await academicService.createTerm({
        name: newTermName,
        startDate: newTermStart,
        endDate: newTermEnd
      });

      toast.success('Khởi tạo học kỳ học vụ mới thành công!', { id: 'create-term' });
      setIsCreateModalOpen(false);
      setNewTermName('');
      setNewTermStart('');
      setNewTermEnd('');
      
      // Reload list
      loadInitialData();
    } catch (error: any) {
      toast.error(`Khởi tạo thất bại: ${error.message}`, { id: 'create-term' });
    }
  };

  // Xử lý Thay đổi Khóa Học kỳ
  const handleToggleLockTerm = async (termId: string, currentLockState: boolean) => {
    try {
      const updatedState = !currentLockState;
      toast.loading('Đang cập nhật trạng thái bảo mật học kỳ...', { id: 'lock-term' });

      await academicService.updateTerm(termId, { isLocked: updatedState });

      toast.success(
        updatedState 
          ? '🔒 Đã kích hoạt bảo vệ đóng băng học kỳ!' 
          : '🔓 Đã mở khóa cổng tương tác học kỳ!',
        { id: 'lock-term' }
      );

      // Dispatch event to storage for other tabs syncing
      localStorage.setItem('academic-semester-locked', String(updatedState));
      window.dispatchEvent(new Event('storage'));

      loadInitialData();
    } catch (error: any) {
      toast.error(`Không thể thay đổi trạng thái khóa: ${error.message}`, { id: 'lock-term' });
    }
  };

  // Lưu cấu hình quy chế
  const handleSaveSettings = async () => {
    try {
      toast.loading('Đang cập nhật quy chế chấm điểm hệ thống...', { id: 'save-settings' });

      await Promise.all([
        adminService.updateConfig('MAX_SUBMISSIONS', String(maxSubmissions)),
        adminService.updateConfig('PLAGIARISM_THRESHOLD', String(plagiarismLimit)),
        adminService.updateConfig('RUBRIC_STRICT', String(rubricStrict))
      ]);

      toast.success('Đã đồng bộ hóa quy chế học vụ toàn khoa thành công!', { id: 'save-settings' });
    } catch (error: any) {
      toast.error(`Không thể cập nhật quy chế: ${error.message}`, { id: 'save-settings' });
    }
  };

  // Tính toán nhãn Trạng thái dựa vào ngày bắt đầu & kết thúc
  const getTermStatus = (term: AcademicTerm) => {
    const now = new Date();
    const start = new Date(term.startDate);
    const end = new Date(term.endDate);

    if (now >= start && now <= end) {
      return { label: 'Đang diễn ra', style: 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900' };
    } else if (now < start) {
      return { label: 'Sắp diễn ra', style: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900' };
    } else {
      return { label: 'Đã lưu trữ', style: 'bg-slate-100 text-slate-500 border dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Quản lý Học kỳ & Khóa Dữ liệu <Calendar className="w-8 h-8 text-indigo-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Thiết lập danh mục học kỳ, đóng băng chỉnh sửa điểm số toàn hệ thống và điều chỉnh các thông số quy chế.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold transition-all text-xs shadow-md cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Tạo Học kỳ mới
        </button>
      </div>

      {/* CORE CONTROL CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: LIST OF TERMS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg rounded-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-850 dark:text-white text-base">Danh mục Học kỳ học tập</h3>
              <span className="text-xs font-bold text-slate-400">Đồng bộ trực tiếp từ cơ sở dữ liệu</span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : terms.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold border border-dashed rounded-xl">
                Không tìm thấy học kỳ nào trong hệ thống.
              </div>
            ) : (
              <div className="space-y-4">
                {terms.map((term) => {
                  const statusInfo = getTermStatus(term);
                  return (
                    <div 
                      key={term.id} 
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-600">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{term.name}</h4>
                            <span className={statusInfo.style}>{statusInfo.label}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold">
                            Bắt đầu: {new Date(term.startDate).toLocaleDateString('vi-VN')} • Kết thúc: {new Date(term.endDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 justify-between sm:justify-end">
                        {/* Lock / Unlock Toggle directly per term */}
                        <button
                          onClick={() => handleToggleLockTerm(term.id, term.isLocked)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                            term.isLocked 
                              ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900' 
                              : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900'
                          }`}
                        >
                          {term.isLocked ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-rose-500" />
                              <span>Đã Khóa</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Mở Khóa</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* PARAMETER CONFIGURATION FORM */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg rounded-2xl p-6 text-left">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <Settings className="w-5 h-5 text-slate-400 shrink-0" />
              <h3 className="font-bold text-slate-850 dark:text-white text-base">Cấu hình Quy chế chấm báo cáo</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Max Submissions per group */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số lần nộp tối đa / Nhóm</label>
                    <span title="Số phiên bản (v1, v2...) tối đa một nhóm sinh viên được tải đè báo cáo lên hệ thống.">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                    </span>
                  </div>
                  <input
                    type="number"
                    value={maxSubmissions}
                    onChange={(e) => setMaxSubmissions(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/40 text-sm focus:outline-none text-slate-700 dark:text-slate-300"
                  />
                </div>

                {/* Plagiarism limit threshold */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ngưỡng cảnh báo Đạo văn (%)</label>
                    <span title="Hệ thống sẽ bôi đỏ cảnh báo khẩn cấp tại dashboard chấm điểm nếu kết quả quét Turnitin vượt ngưỡng này.">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={plagiarismLimit}
                      onChange={(e) => setPlagiarismLimit(Number(e.target.value))}
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/40 text-sm focus:outline-none text-slate-700 dark:text-slate-300"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              </div>

              {/* Strict validation toggle */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850">
                <div className="space-y-0.5 text-left">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Bắt buộc khóa tổng trọng số Rubric = 100%</h4>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">Khi bật, Giảng viên bắt buộc phải thiết lập tổng trọng số các tiêu chí bằng chính xác 100% mới được quyền lưu Rubric.</p>
                </div>
                <button
                  onClick={() => setRubricStrict(!rubricStrict)}
                  className={`w-10 h-6 rounded-full p-1 transition-all cursor-pointer shrink-0 ${rubricStrict ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${rubricStrict ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={handleSaveSettings}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  Lưu cấu hình quy chế
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: CORE SUMMARY & INFORMATION */}
        <div className="lg:col-span-1">
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-6 text-left h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0" />
                <h3 className="font-bold text-slate-850 dark:text-white text-base">Cơ chế Bảo vệ khóa điểm</h3>
              </div>

              <div className="p-5 rounded-2xl border text-center space-y-3 bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-950">
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center border-4 bg-indigo-500 text-white border-indigo-200 dark:border-indigo-950">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black text-indigo-600 dark:text-indigo-400">
                    BẢO MẬT ĐỒNG BỘ
                  </h4>
                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                    Khi học kỳ ở trạng thái Khóa, sinh viên không được phép nộp báo cáo, giảng viên chỉ xem điểm mà không thể lưu chỉnh sửa mới.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                <div className="flex gap-2">
                  <span className="text-indigo-600 select-none">✦</span>
                  <p>Phòng đào tạo có đặc quyền đóng mở cổng nhập điểm độc lập cho từng học kỳ học vụ.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-indigo-600 select-none">✦</span>
                  <p>Tương thích hoàn hảo với cơ chế concurrency control (OCC) chống ghi đè dữ liệu trùng lặp.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL: TẠO HỌC KỲ MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 text-left animate-in zoom-in-95 duration-250">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> Khởi tạo Học kỳ học vụ mới
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tên học kỳ</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Học kỳ 1 (2025-2026)"
                  value={newTermName}
                  onChange={(e) => setNewTermName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ngày bắt đầu</label>
                <input
                  type="date"
                  required
                  value={newTermStart}
                  onChange={(e) => setNewTermStart(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ngày kết thúc</label>
                <input
                  type="date"
                  required
                  value={newTermEnd}
                  onChange={(e) => setNewTermEnd(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Khởi hoạt ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
