import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Copy, 
  AlertTriangle, 
  CheckCircle, 
  Sliders,
  HelpCircle,
  FolderOpen,
  Loader2,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { teacherService, type Rubric, type RubricCriterion } from '@/services/teacherService';

export default function RubricDesigner() {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State cho Rubric mới
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCriteria, setNewCriteria] = useState<Array<{ name: string; description: string; maxScore: number; weight: number }>>([
    { name: 'Nội dung & Kiến trúc hệ thống', description: 'Thiết kế sơ đồ, kiến trúc database.', maxScore: 10, weight: 30 },
    { name: 'Mã nguồn & Công nghệ áp dụng', description: 'Clean code, tối ưu cấu trúc, áp dụng đúng pattern.', maxScore: 10, weight: 30 },
    { name: 'Demo & Kiểm thử chất lượng', description: 'Ứng dụng chạy thực tế ổn định, có test unit.', maxScore: 10, weight: 20 },
    { name: 'Thuyết trình & Slide báo cáo', description: 'Trình bày chuyên nghiệp, trả lời tốt phản biện.', maxScore: 10, weight: 20 }
  ]);

  const [totalWeight, setTotalWeight] = useState(100);

  // Load danh sách Rubrics từ API
  const fetchRubrics = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getRubrics();
      setRubrics(data);
      if (data.length > 0 && !selectedRubric && !isCreating) {
        setSelectedRubric(data[0]);
      }
    } catch (err) {
      toast.error("Không thể tải danh sách bảng Rubric.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRubrics();
  }, []);

  // Tính toán tổng trọng số (%) mỗi khi newCriteria thay đổi
  useEffect(() => {
    const total = newCriteria.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
    setTotalWeight(total);
  }, [newCriteria]);

  const handleAddCriterion = () => {
    setNewCriteria([...newCriteria, {
      name: '',
      description: '',
      maxScore: 10,
      weight: 0
    }]);
    toast.success('Đã thêm một dòng tiêu chí mới!');
  };

  const handleRemoveCriterion = (index: number) => {
    setNewCriteria(newCriteria.filter((_, idx) => idx !== index));
    toast.info('Đã xóa tiêu chí khỏi danh sách tạo.');
  };

  const handleUpdateCriterion = (index: number, field: string, value: any) => {
    setNewCriteria(newCriteria.map((c, idx) => {
      if (idx === index) {
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  const handleApplyTemplate = () => {
    setNewCriteria([
      { name: 'Nội dung báo cáo (Technical Report)', description: 'Giải pháp kỹ thuật, phân tích thiết kế, mô tả logic hệ thống.', maxScore: 10, weight: 40 },
      { name: 'Demo Sản phẩm & Triển khai', description: 'Giao diện chạy thực nghiệm mượt mà, deploy thành công lên host/cloud.', maxScore: 10, weight: 40 },
      { name: 'Kỹ năng làm việc nhóm & Phản biện', description: 'Tác phong chuyên nghiệp, trả lời chính xác câu hỏi của hội đồng.', maxScore: 10, weight: 20 }
    ]);
    toast.success('Đã áp dụng khung Rubric mẫu tiêu chuẩn 40-40-20!');
  };

  const handleSaveRubric = async () => {
    if (!newTitle.trim()) {
      toast.error('Vui lòng nhập tên bảng Rubric!');
      return;
    }
    if (totalWeight !== 100) {
      toast.error('Không thể lưu! Tổng trọng số của tất cả tiêu chí bắt buộc phải bằng chính xác 100%.');
      return;
    }

    try {
      setSaving(true);
      const created = await teacherService.createRubric({
        title: newTitle,
        description: newDescription,
        criteria: newCriteria
      });
      toast.success('Tạo bảng tiêu chí Rubric thành công!');
      
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setIsCreating(false);
      
      // Reload list và chọn rubric mới tạo
      await fetchRubrics();
      setSelectedRubric(created);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo Rubric.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRubric = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bảng Rubric này? Lưu ý: Không thể xóa Rubric đã được áp dụng để chấm điểm bài nộp.")) return;

    try {
      await teacherService.deleteRubric(id);
      toast.success('Đã xóa bảng Rubric thành công!');
      setSelectedRubric(null);
      fetchRubrics();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa Rubric (có thể Rubric này đã được dùng để chấm điểm).');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold">Đang tải danh sách bảng Rubric...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Thiết kế Rubric Chấm điểm <span className="text-indigo-600 dark:text-indigo-400"><Sliders className="w-8 h-8" /></span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Xây dựng danh sách tiêu chí chấm điểm, thiết lập trọng số phần trăm (%) tương ứng áp dụng chung cho các đồ án.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isCreating ? (
            <>
              <button
                onClick={handleApplyTemplate}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all text-sm shadow-sm"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                Dùng mẫu 40-40-20
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  if (rubrics.length > 0) setSelectedRubric(rubrics[0]);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold transition-all text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveRubric}
                disabled={saving || totalWeight !== 100}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-md ${
                  totalWeight === 100 && !saving
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                    : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none'
                }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu Rubric mới
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsCreating(true);
                setSelectedRubric(null);
                setNewTitle('');
                setNewDescription('');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm shadow-md shadow-indigo-600/10"
            >
              <Plus className="w-4 h-4" />
              Tạo Rubric mới
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR: DANH SÁCH RUBRIC ĐÃ CÓ */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-left">Bảng Rubric của bạn ({rubrics.length})</h3>
          
          <div className="space-y-3">
            {rubrics.length > 0 ? (
              rubrics.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedRubric(r);
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                    selectedRubric?.id === r.id && !isCreating
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-between w-full">
                    <span className="font-bold text-sm truncate max-w-[150px]">{r.title}</span>
                    <FolderOpen className={`w-4 h-4 shrink-0 ${selectedRubric?.id === r.id && !isCreating ? 'text-indigo-100' : 'text-slate-400'}`} />
                  </div>
                  {r.description && (
                    <p className={`text-xs truncate w-full ${selectedRubric?.id === r.id && !isCreating ? 'text-indigo-100/85' : 'text-slate-400'}`}>
                      {r.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1 text-[10px] uppercase font-bold tracking-wider">
                    <span className={selectedRubric?.id === r.id && !isCreating ? 'text-indigo-100' : 'text-slate-400'}>
                      {r.criteria.length} Tiêu chí
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-950/20">
                Chưa có bảng Rubric nào. Hãy bấm "Tạo Rubric mới"!
              </div>
            )}
          </div>
        </div>

        {/* CHI TIẾT HOẶC MÀN HÌNH TẠO MỚI */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* MÀN HÌNH 1: TẠO MỚI RUBRIC */}
          {isCreating ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Settings Card */}
              <Card className="border border-slate-200 bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-6 text-left">
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"><Sliders className="w-5 h-5" /></span>
                    Thiết lập thông tin chung Rubric mới
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-1 space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tên bảng Rubric</label>
                      <input
                        type="text"
                        placeholder="Nhập tên dễ phân biệt..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mô tả tóm tắt nội dung áp dụng</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Áp dụng chấm đề tài đồ án cuối kỳ môn CNPM..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Monitor Card */}
              <Card className="border border-slate-200 bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-6 text-left">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Trình giám sát tỉ lệ trọng số</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Tổng trọng số (%) của các tiêu chí con bắt buộc phải bằng chính xác 100%.</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center">
                      <span className={`text-3xl font-black ${totalWeight === 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {totalWeight}%
                      </span>
                    </div>
                    <div>
                      {totalWeight === 100 ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          Hợp lệ để lưu!
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                          Tổng phải bằng 100%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Dynamic Criteria List Card */}
              <Card className="border border-slate-200 bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-6 text-left">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Xây dựng tiêu chí con</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">Nhập tên, mô tả cách chấm điểm, thang điểm tối đa (1-10) và trọng số tương ứng.</p>
                  </div>
                  <button
                    onClick={handleAddCriterion}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm tiêu chí
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {newCriteria.map((item, index) => (
                    <div 
                      key={index} 
                      className="p-5 border border-slate-150 dark:border-slate-800/80 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30 flex flex-col md:flex-row items-start gap-4 transition-all relative group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                        0{index + 1}
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div className="md:col-span-1 space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên tiêu chí</label>
                          <input
                            type="text"
                            value={item.name}
                            placeholder="Ví dụ: Kỹ thuật lập trình"
                            onChange={(e) => handleUpdateCriterion(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mô tả cách thức chấm điểm</label>
                          <input
                            type="text"
                            value={item.description}
                            placeholder="Ví dụ: Định dạng clean code, cấu trúc thư mục chuẩn..."
                            onChange={(e) => handleUpdateCriterion(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto self-stretch md:self-auto shrink-0 pt-2 md:pt-0 border-t border-slate-100 md:border-t-0 dark:border-slate-800">
                        <div className="space-y-1.5 text-left w-24">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Điểm tối đa</label>
                          <input
                            type="number"
                            value={item.maxScore}
                            min={1}
                            max={10}
                            onChange={(e) => handleUpdateCriterion(index, 'maxScore', Number(e.target.value) || 10)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-center"
                          />
                        </div>

                        <div className="space-y-1.5 text-left w-24">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trọng số (%)</label>
                          <input
                            type="number"
                            value={item.weight}
                            min={0}
                            max={100}
                            onChange={(e) => handleUpdateCriterion(index, 'weight', Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-center text-indigo-600 dark:text-indigo-400"
                          />
                        </div>

                        <button
                          onClick={() => handleRemoveCriterion(index)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all md:opacity-0 group-hover:opacity-100 self-end mt-4"
                          title="Xóa tiêu chí này"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>
          ) : selectedRubric ? (
            /* MÀN HÌNH 2: XEM CHI TIẾT RUBRIC HIỆN CÓ */
            <div className="space-y-8 animate-in fade-in duration-300 text-left">
              
              {/* General Info Display */}
              <Card className="border border-slate-200 bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-6 relative">
                <button
                  onClick={() => handleDeleteRubric(selectedRubric.id)}
                  className="absolute top-6 right-6 p-2 rounded-xl text-rose-600 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all flex items-center gap-1 text-xs font-bold"
                  title="Xóa bảng Rubric"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa Rubric này
                </button>

                <div className="space-y-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    Bảng Rubric hoạt động
                  </span>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{selectedRubric.title}</h2>
                  {selectedRubric.description ? (
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                      {selectedRubric.description}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic text-sm">Không có mô tả chi tiết.</p>
                  )}
                </div>
              </Card>

              {/* Criteria List View */}
              <Card className="border border-slate-200 bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Danh sách tiêu chí chấm điểm ({selectedRubric.criteria.length})</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">Nội dung chi tiết được sử dụng trực tiếp trong giao diện chấm điểm.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {selectedRubric.criteria.map((item, index) => (
                    <div 
                      key={item.id || index} 
                      className="p-5 border border-slate-150 dark:border-slate-800/60 rounded-2xl bg-slate-50/10 dark:bg-slate-900/10 flex flex-col md:flex-row items-start gap-4 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black shrink-0">
                        0{index + 1}
                      </div>

                      <div className="flex-1 text-left">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-snug">{item.name}</h4>
                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t border-slate-100 md:border-t-0 dark:border-slate-800">
                        <div className="text-left">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Điểm tối đa</p>
                          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 text-center">{item.maxScore}đ</p>
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Trọng số</p>
                          <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5 text-center">{item.weight}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>
          ) : (
            /* CHƯA CHỌN GÌ */
            <Card className="border border-slate-200 bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-16 text-center">
              <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-850">
                  <Sliders className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Bắt đầu thiết kế Rubric</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Lựa chọn một bảng Rubric hiện có ở bên thanh trái để xem chi tiết, hoặc bấm vào nút tạo mới để tự tay xây dựng một bộ tiêu chí chấm điểm chất lượng cao.
                </p>
              </div>
            </Card>
          )}

        </div>

      </div>

    </div>
  );
}
