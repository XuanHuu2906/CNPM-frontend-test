import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  FileText,
  Loader2,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { teacherService } from '@/services/teacherService';
import type { Submission } from '@/services/teacherService';

export default function TeacherStatistics() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);

  // Load danh sách lớp khi mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await teacherService.getTeacherProfile();
        const assignments = data.teacher?.assignments || [];
        
        if (assignments.length > 0) {
          const mappedClasses = assignments.map(a => ({
            id: a.class.id,
            code: a.class.classCode,
            name: a.class.subject.name,
            term: a.class.term.name,
          }));
          setClasses(mappedClasses);
          setSelectedClass(mappedClasses[0].id);
        } else {
          toast.warning("Bạn chưa được phân công quản lý lớp học phần nào!");
        }
      } catch (err) {
        toast.error("Lỗi khi tải thông tin lớp phân công.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Tải dữ liệu các bài nộp & danh sách nhóm khi chuyển đổi lớp
  useEffect(() => {
    if (!selectedClass) return;

    const fetchClassData = async () => {
      try {
        setFetchingData(true);
        const [subsData, groupsData] = await Promise.all([
          teacherService.getClassSubmissions(selectedClass),
          teacherService.getClassGroups(selectedClass)
        ]);
        setSubmissions(subsData);
        setGroups(groupsData);
      } catch (err) {
        toast.error("Không thể tải thông tin thống kê của lớp này.");
      } finally {
        setFetchingData(false);
      }
    };

    fetchClassData();
  }, [selectedClass]);

  // CÁC PHÂN TÍCH THỐNG KÊ CHI TIẾT TỪ DỮ LIỆU THỰC TẾ
  const totalGroups = groups.length || submissions.length || 0;
  
  const gradedSubmissions = submissions.filter((s: any) => {
    const hasScore = s.grades && s.grades.length > 0;
    return hasScore && (s.status === 'DA_CHAM' || s.status === 'HOAN_THANH');
  });

  const gradedGroups = gradedSubmissions.length;
  const pendingGroups = totalGroups - gradedGroups;

  // Trích xuất điểm số thật
  const scores = gradedSubmissions.map((s: any) => Number(s.grades![0].finalScore));

  const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  // Phổ điểm chi tiết cho Biểu đồ cột (Bar chart)
  const barChartData = [
    { range: '0 - 4', count: scores.filter(s => s >= 0 && s < 4).length },
    { range: '4 - 5', count: scores.filter(s => s >= 4 && s < 5).length },
    { range: '5 - 6', count: scores.filter(s => s >= 5 && s < 6).length },
    { range: '6 - 7', count: scores.filter(s => s >= 6 && s < 7).length },
    { range: '7 - 8', count: scores.filter(s => s >= 7 && s < 8).length },
    { range: '8 - 9', count: scores.filter(s => s >= 8 && s < 9).length },
    { range: '9 - 10', count: scores.filter(s => s >= 9 && s <= 10).length }
  ];

  const maxBarCount = Math.max(...barChartData.map(b => b.count)) || 1;

  // Xếp loại học lực
  const excelCount = scores.filter(s => s >= 8.5).length;
  const goodCount = scores.filter(s => s >= 7.0 && s < 8.5).length;
  const avgCount = scores.filter(s => s >= 5.0 && s < 7.0).length;
  const failCount = scores.filter(s => s < 5.0).length;

  const scoreDistribution = [
    { 
      label: '8.5 - 10 (Giỏi / Xuất sắc)', 
      count: excelCount, 
      percentage: totalGroups > 0 ? Math.round((excelCount / totalGroups) * 100) : 0, 
      color: 'bg-emerald-500' 
    },
    { 
      label: '7.0 - 8.4 (Khá)', 
      count: goodCount, 
      percentage: totalGroups > 0 ? Math.round((goodCount / totalGroups) * 100) : 0, 
      color: 'bg-indigo-500' 
    },
    { 
      label: '5.0 - 6.9 (Trung bình)', 
      count: avgCount, 
      percentage: totalGroups > 0 ? Math.round((avgCount / totalGroups) * 100) : 0, 
      color: 'bg-amber-500' 
    },
    { 
      label: '< 5.0 (Yếu / Kém)', 
      count: failCount, 
      percentage: totalGroups > 0 ? Math.round((failCount / totalGroups) * 100) : 0, 
      color: 'bg-rose-500' 
    }
  ];

  // Xuất file CSV thống kê chuyên sâu
  const handleExportCSV = () => {
    if (totalGroups === 0) {
      toast.warning("Không có dữ liệu thống kê để xuất!");
      return;
    }

    const activeClass = classes.find(c => c.id === selectedClass);
    const className = activeClass ? activeClass.code : 'Lop_Hoc';

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += `BÁO CÁO THỐNG KÊ KẾT QUẢ HỌC PHẦN LỚP ${className}\n\n`;
    csvContent += `Chỉ số thống kê,Giá trị thực tế\n`;
    csvContent += `Tổng số nhóm/đồ án đề tài,${totalGroups}\n`;
    csvContent += `Đã hoàn thành chấm điểm,${gradedGroups} (${totalGroups > 0 ? Math.round((gradedGroups/totalGroups)*100) : 0}%)\n`;
    csvContent += `Điểm trung bình lớp,${avgScore}\n`;
    csvContent += `Điểm cao nhất,${highestScore}\n`;
    csvContent += `Điểm thấp nhất,${lowestScore}\n\n`;

    csvContent += `XẾP LOẠI HỌC LỰC MÔN HỌC\n`;
    csvContent += `Xếp loại,Số lượng nhóm,Tỉ lệ phần trăm\n`;
    scoreDistribution.forEach(d => {
      csvContent += `"${d.label}",${d.count} nhóm,${d.percentage}%\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Thong_Ke_Lop_${className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Đã tải xuống bảng báo cáo thống kê lớp ${className} thành công!`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold">Đang tính toán nạp dữ liệu thống kê...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:p-8 print:bg-white">
      
      {/* TITLE SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Thống kê kết quả & Phân tích điểm <span className="text-indigo-600 dark:text-indigo-400"><BarChart3 className="w-8 h-8" /></span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Xem biểu đồ phổ điểm, tiến độ chấm bài và tỉ lệ xếp loại học lực thực tế từ cơ sở dữ liệu.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-xs shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Excel Thống kê
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all text-xs shadow-md shadow-rose-600/10 hover:shadow-rose-600/20"
          >
            <FileText className="w-4 h-4" />
            In PDF Thống kê
          </button>
        </div>
      </div>

      {/* CHOOSE ACTIVE CLASS TABS */}
      {classes.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0 print:hidden">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => {
                setSelectedClass(cls.id);
                toast.info(`Nạp dữ liệu phân tích phổ điểm lớp ${cls.code}`);
              }}
              className={`px-5 py-3 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                selectedClass === cls.id
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {cls.code} - {cls.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-6 rounded-2xl text-center text-amber-700 dark:text-amber-400 font-bold">
          Không tìm thấy lớp giảng dạy phân công để thống kê.
        </div>
      )}

      {fetchingData ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-bold">Đang quét cơ sở dữ liệu tính toán phổ điểm...</p>
        </div>
      ) : (
        <>
          {/* STATS COUNT OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 flex flex-col justify-between">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng số nhóm học phần</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{totalGroups}</span>
                <span className="text-xs text-slate-400 font-semibold">Nhóm đồ án</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '100%' }} />
              </div>
            </Card>

            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 flex flex-col justify-between">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tiến độ chấm bài</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-500">
                  {totalGroups > 0 ? Math.round((gradedGroups / totalGroups) * 100) : 0}%
                </span>
                <span className="text-xs text-slate-400 font-semibold">{gradedGroups}/{totalGroups} hoàn tất</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalGroups > 0 ? (gradedGroups / totalGroups) * 100 : 0}%` }} />
              </div>
            </Card>

            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 flex flex-col justify-between">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Điểm số trung bình lớp</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{avgScore}</span>
                <span className="text-xs text-slate-400 font-semibold">Thang 10đ</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${avgScore * 10}%` }} />
              </div>
            </Card>

            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 flex flex-col justify-between">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Thủ khoa môn học</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{highestScore}</span>
                <span className="text-xs text-slate-400 font-semibold">Điểm cao nhất</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${highestScore * 10}%` }} />
              </div>
            </Card>
          </div>

          {totalGroups > 0 ? (
            /* DIAGRAM SECTIONS */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Score bar chart */}
              <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg rounded-2xl p-6 text-left">
                <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Biểu đồ phổ điểm thật</CardTitle>
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </CardHeader>

                {gradedGroups > 0 ? (
                  <div className="mt-8 h-64 flex items-end justify-between gap-3 px-4">
                    {barChartData.map((bar, idx) => {
                      const heightPercent = Math.max(4, Math.round((bar.count / maxBarCount) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all">
                            {bar.count} nhóm
                          </span>
                          <div className="w-full rounded-t-lg bg-indigo-50 dark:bg-indigo-950/20 group-hover:bg-indigo-600 transition-all relative" style={{ height: `${heightPercent}%` }}>
                            {bar.count > 0 && <div className="absolute inset-x-0 bottom-0 top-0 bg-indigo-500 rounded-t-lg opacity-75 group-hover:opacity-100" />}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">{bar.range}đ</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-24 text-center text-slate-400 font-semibold text-xs">
                    Chưa có bài báo cáo nào được chấm điểm để tạo phổ điểm.
                  </div>
                )}
              </Card>

              {/* Learning capacity classification */}
              <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg rounded-2xl p-6 text-left flex flex-col justify-between">
                <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Xếp loại học lực</CardTitle>
                  <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </CardHeader>

                {gradedGroups > 0 ? (
                  <div className="space-y-4 flex-1 flex flex-col justify-center mt-6">
                    {scoreDistribution.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            {item.label}
                          </span>
                          <span>{item.count} nhóm ({item.percentage}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center text-slate-400 font-semibold text-xs">
                    Chưa xếp loại được học lực do chưa có bài chấm điểm.
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="p-16 border border-dashed rounded-3xl text-center bg-white dark:bg-slate-900 text-slate-400 font-semibold">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto animate-pulse" />
              <p className="mt-3">Lớp học phần này hiện tại chưa có dữ liệu nhóm học lực để phân tích.</p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
