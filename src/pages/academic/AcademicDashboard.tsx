import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  FileText,
  Clock,
  Activity,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Sparkles,
  Search,
  Download,
  Award,
  BookMarked,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { academicService } from '../../services/academicService';

interface ProgressStudent {
  id: string;
  groupName: string;
  student: string;
  mssv: string;
  code: string;
  subject: string;
  dept: string;
  lecturer: string;
  date: string;
  version: string;
  status: 'CHUA_NOP' | 'DA_NOP' | 'DANG_CHAM' | 'YEU_CAU_SUA' | 'DA_CHAM' | 'CHO_DUYET' | 'HOAN_THANH' | 'TU_CHOI';
  score: number | null;
}

export default function AcademicDashboard() {
  const navigate = useNavigate();
  // 1. Quản lý Bộ lọc (Filter States)
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedLecturer, setSelectedLecturer] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | ProgressStudent['status']>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 2. Dữ liệu thực tế từ API
  const [studentsProgress, setStudentsProgress] = useState<ProgressStudent[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  // Tải dữ liệu bất đồng bộ từ backend
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [termsData, subsData] = await Promise.all([
          academicService.getAllTerms(),
          academicService.getAllSubmissions()
        ]);

        setSemesters(termsData);

        // Map submissions sang schema ProgressStudent hiển thị
        const mappedProgress: ProgressStudent[] = subsData.map((sub: any) => {
          const mainLecturer = sub.class?.assignments?.find((a: any) => a.role === 'CHAM_CHINH')?.teacher?.user?.fullName || 'Chưa phân công';
          return {
            id: sub.id,
            groupName: sub.group?.name || 'Báo cáo cá nhân',
            student: sub.student?.user?.fullName || 'Sinh viên',
            mssv: sub.student?.studentCode || 'N/A',
            code: sub.class?.classCode || 'N/A',
            subject: sub.class?.subject?.name || 'N/A',
            dept: sub.class?.subject?.subjectCode?.substring(0, 2) || 'CNPM', // Rút trích mã bộ môn
            lecturer: mainLecturer,
            date: sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('vi-VN') : '-',
            version: sub.version ? `v${sub.version}` : 'v1',
            status: sub.status,
            score: sub.score !== undefined ? sub.score : null
          };
        });

        setStudentsProgress(mappedProgress);

        // Trích xuất danh sách giảng viên duy nhất cho dropdown filter
        const uniqueLecturers = Array.from(
          new Set(mappedProgress.map(s => s.lecturer).filter(l => l && l !== 'Chưa phân công'))
        );
        setLecturers(uniqueLecturers);

        // Trích xuất danh sách lớp học phần và môn học duy nhất
        const uniqueClasses = Array.from(
          new Set(mappedProgress.map(s => s.code).filter(c => c && c !== 'N/A'))
        );
        setClasses(uniqueClasses);

        const uniqueSubjects = Array.from(
          new Set(mappedProgress.map(s => s.subject).filter(sub => sub && sub !== 'N/A'))
        );
        setSubjects(uniqueSubjects);

      } catch (error: any) {
        toast.error(`Không thể tải dữ liệu tiến trình học vụ: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Bộ lọc dữ liệu hiển thị (Client-side search and filter)
  const filteredStudents = studentsProgress.filter(student => {
    const matchesSearch =
      student.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.mssv.includes(searchQuery) ||
      student.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'all' || student.dept === selectedDept;
    const matchesLecturer = selectedLecturer === 'all' || student.lecturer === selectedLecturer;
    const matchesStatus = selectedStatusTab === 'all' || student.status === selectedStatusTab;
    const matchesClass = selectedClass === 'all' || student.code === selectedClass;
    const matchesSubject = selectedSubject === 'all' || student.subject === selectedSubject;

    return matchesSearch && matchesDept && matchesLecturer && matchesStatus && matchesClass && matchesSubject;
  });

  // Reset page khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSemester, selectedDept, selectedLecturer, searchQuery, selectedStatusTab, selectedClass, selectedSubject]);

  // Tính toán phân trang
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Tự động tính toán lại KPI động dựa trên bộ lọc
  const totalCount = filteredStudents.length;
  const completedCount = filteredStudents.filter(s => s.status === 'HOAN_THANH').length;
  const pendingApprovalCount = filteredStudents.filter(s => s.status === 'CHO_DUYET').length;
  const gradingCount = filteredStudents.filter(s => s.status === 'DANG_CHAM' || s.status === 'DA_CHAM').length;

  const dynamicStats = [
    {
      title: 'Đang theo dõi',
      value: totalCount,
      description: 'Số lượng sinh viên/nhóm bộ lọc',
      icon: Users,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Đã hoàn thành',
      value: completedCount,
      description: 'Kết quả điểm đã phê duyệt',
      icon: Award,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Chờ duyệt điểm',
      value: pendingApprovalCount,
      description: 'Cần duyệt kết quả gấp',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Đang xử lý chấm',
      value: gradingCount,
      description: 'Giảng viên đang chấm điểm',
      icon: Activity,
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
    }
  ];

  // 3. Dữ liệu Phân bộ Trạng thái Báo cáo (PieChart)
  const statusData = [
    { name: 'Đã nộp', value: studentsProgress.filter(s => s.status === 'DA_NOP').length, color: '#6366f1' },
    { name: 'Đang chấm', value: studentsProgress.filter(s => s.status === 'DANG_CHAM' || s.status === 'DA_CHAM').length, color: '#3b82f6' },
    { name: 'Chờ duyệt', value: studentsProgress.filter(s => s.status === 'CHO_DUYET').length, color: '#eab308' },
    { name: 'Hoàn thành', value: studentsProgress.filter(s => s.status === 'HOAN_THANH').length, color: '#10b981' },
    { name: 'Từ chối / Khác', value: studentsProgress.filter(s => s.status === 'TU_CHOI' || s.status === 'YEU_CAU_SUA').length, color: '#f43f5e' }
  ];

  // 4. Dữ liệu Thống kê theo Bộ môn (BarChart)
  const deptData = [
    { name: 'CNPM', 'Đã chấm': studentsProgress.filter(s => s.dept === 'CNPM' && s.status === 'HOAN_THANH').length, 'Tổng số': studentsProgress.filter(s => s.dept === 'CNPM').length },
    { name: 'HTTT', 'Đã chấm': studentsProgress.filter(s => s.dept === 'HTTT' && s.status === 'HOAN_THANH').length, 'Tổng số': studentsProgress.filter(s => s.dept === 'HTTT').length },
    { name: 'KHMT', 'Đã chấm': studentsProgress.filter(s => s.dept === 'KHMT' && s.status === 'HOAN_THANH').length, 'Tổng số': studentsProgress.filter(s => s.dept === 'KHMT').length },
    { name: 'KTMT', 'Đã chấm': studentsProgress.filter(s => s.dept === 'KTMT' && s.status === 'HOAN_THANH').length, 'Tổng số': studentsProgress.filter(s => s.dept === 'KTMT').length },
    { name: 'MMT', 'Đã chấm': studentsProgress.filter(s => s.dept === 'MMT' && s.status === 'HOAN_THANH').length, 'Tổng số': studentsProgress.filter(s => s.dept === 'MMT').length }
  ];

  // 5. Danh sách Cảnh báo Khẩn cấp
  const alerts = [
    {
      id: 1,
      title: "Trễ hạn chấm điểm",
      message: "Lớp học phần SE312.N11 đã quá hạn chấm 3 ngày nhưng giảng viên chưa chốt điểm.",
      type: "DEADLINE",
      time: "3 ngày trước",
      color: "bg-rose-50/30 border-rose-100/50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
    },
    {
      id: 2,
      title: "Cận kề deadline nộp báo cáo",
      message: "Lớp học phần SE104.O12 còn 2 nhóm chưa nộp báo cáo chính thức.",
      type: "WARNING",
      time: "Hôm qua",
      color: "bg-amber-50/30 border-amber-100/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
    },
    {
      id: 3,
      title: "Lớp mới chưa có giảng viên",
      message: "Học kỳ mới ghi nhận có 2 lớp học phần chưa được phân công giảng viên chấm chính.",
      type: "SYSTEM",
      time: "Vừa xong",
      color: "bg-blue-50/30 border-blue-100/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
    }
  ];

  // Xử lý Xuất file Excel thực tế sang CSV để tải xuống
  const handleExportData = () => {
    setIsExporting(true);
    toast.loading('Đang khởi tạo dữ liệu xuất...', { id: 'export-progress' });

    setTimeout(() => {
      toast.success('Xuất dữ liệu thành công! Tệp tin Excel đang được tải xuống...', { id: 'export-progress' });
      setIsExporting(false);

      const headers = 'ID,Tên nhóm,Sinh viên đại diện,MSSV,Mã lớp,Môn học,Bộ môn,Giảng viên,Ngày nộp,Phiên bản,Trạng thái,Điểm\n';
      const rows = filteredStudents.map(s =>
        `"${s.id}","${s.groupName}","${s.student}","${s.mssv}","${s.code}","${s.subject}","${s.dept}","${s.lecturer}","${s.date}","${s.version}","${s.status}","${s.score ?? '-'}"`
      ).join('\n');

      const blob = new Blob([`\ufeff${headers}${rows}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tien_do_hoc_vu_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1200);
  };

  // Trả về Style màu cho từng loại trạng thái bài nộp
  const getStatusBadgeStyle = (status: ProgressStudent['status']) => {
    switch (status) {
      case 'CHUA_NOP':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'DA_NOP':
        return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
      case 'DANG_CHAM':
        return 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900';
      case 'YEU_CAU_SUA':
        return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900';
      case 'DA_CHAM':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900';
      case 'CHO_DUYET':
        return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900';
      case 'HOAN_THANH':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
      case 'TU_CHOI':
        return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  // Trả về tên hiển thị Tiếng Việt của trạng thái
  const getStatusText = (status: ProgressStudent['status']) => {
    switch (status) {
      case 'CHUA_NOP': return 'Chưa nộp';
      case 'DA_NOP': return 'Đã nộp';
      case 'DANG_CHAM': return 'Đang chấm';
      case 'YEU_CAU_SUA': return 'Yêu cầu sửa';
      case 'DA_CHAM': return 'Đã chấm';
      case 'CHO_DUYET': return 'Chờ duyệt';
      case 'HOAN_THANH': return 'Hoàn thành';
      case 'TU_CHOI': return 'Từ chối';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">

      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Giám sát Tiến độ Toàn khoa <Sparkles className="w-6 h-6 text-indigo-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Bảng theo dõi trực quan dữ liệu chấm điểm & học kỳ liên tục
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-5">
        <div className="flex flex-col gap-5">
          {/* Main Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Học kỳ */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BookMarked className="w-3.5 h-3.5 text-indigo-500" />
                Chọn Học Kỳ
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 dark:text-slate-300"
              >
                <option value="all">Tất cả học kỳ</option>
                {semesters.map(term => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </select>
            </div>

            {/* Bộ môn */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Chọn Bộ Môn
              </label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  if (e.target.value === 'all') {
                    setSelectedSubject('all');
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 dark:text-slate-300"
              >
                <option value="all">Tất cả bộ môn</option>
                <option value="CNPM">Công nghệ Phần mềm (CNPM)</option>
                <option value="HTTT">Hệ thống Thông tin (HTTT)</option>
                <option value="KHMT">Khoa học Máy tính (KHMT)</option>
                <option value="KTMT">Kỹ thuật Máy tính (KTMT)</option>
                <option value="MMT">Mạng máy tính (MMT)</option>
              </select>
            </div>

            {/* Lớp học phần */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BookMarked className="w-3.5 h-3.5 text-indigo-500" />
                Lớp học phần
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 dark:text-slate-300"
              >
                <option value="all">Tất cả lớp học phần</option>
                {classes.map((cls, idx) => (
                  <option key={idx} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Ô Tìm kiếm */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-indigo-500" />
                Tìm kiếm nhanh
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Họ tên, MSSV, Mã nhóm..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 dark:text-slate-300 placeholder-slate-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Toggle Advanced Filters Button */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {showAdvancedFilters ? "Đang hiện bộ lọc nâng cao" : "Bộ lọc nâng cao ẩn"}
            </span>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-xl transition-all border border-indigo-100 dark:border-indigo-900/40 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Bộ lọc nâng cao
              {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850/60 animate-in slide-in-from-top-2 duration-300">
              {/* Giảng viên */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  Giảng viên chấm chính
                </label>
                <select
                  value={selectedLecturer}
                  onChange={(e) => setSelectedLecturer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 dark:text-slate-300"
                >
                  <option value="all">Tất cả giảng viên</option>
                  {lecturers.map((lect, idx) => (
                    <option key={idx} value={lect}>{lect}</option>
                  ))}
                </select>
              </div>

              {/* Môn học - Chỉ hiện nếu bộ môn đã được chọn */}
              {selectedDept !== 'all' ? (
                <div className="space-y-1.5 text-left animate-in fade-in duration-200">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BookMarked className="w-3.5 h-3.5 text-indigo-500" />
                    Môn học
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 dark:text-slate-300"
                  >
                    <option value="all">Tất cả môn học</option>
                    {subjects.map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider justify-center md:col-span-2">
                  Vui lòng chọn bộ môn ở bộ lọc chính để hiển thị môn học
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* KPI GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dynamicStats.map((stat, idx) => {
            const IconComponent = stat.icon;
            const isClickable = stat.title === 'Chờ duyệt điểm';
            return (
              <Card
                key={idx}
                onClick={isClickable ? () => navigate('/academic/approvals') : undefined}
                className={`border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm rounded-2xl transition-all duration-300 ${isClickable
                  ? 'hover:scale-[1.02] cursor-pointer hover:border-amber-400/50 hover:shadow-amber-500/5'
                  : 'hover:scale-[1.02]'
                  }`}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.title}</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{stat.value}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">{stat.description}</p>
                  </div>
                  <div className={`p-3.5 rounded-xl ${stat.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* BAR CHART: TIẾN ĐỘ BỘ MÔN */}
        <Card className="lg:col-span-2 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 flex flex-col justify-between">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <div className="text-left">
              <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                <Activity className="w-5 h-5 text-indigo-500" /> Tiến độ Chấm điểm theo Bộ môn
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                So sánh số lượng bài nộp đã chấm điểm so với tổng số bài báo cáo
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold', paddingTop: 10 }} />
                <Bar dataKey="Đã chấm" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Tổng số" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PIE CHART: PHÂN BỔ TRẠNG THÁI */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 flex flex-col justify-between">
          <CardHeader className="p-0 pb-4">
            <div className="text-left">
              <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-indigo-500" /> Trạng thái Toàn bộ Bài nộp
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                Tỷ lệ phần trăm các giai đoạn báo cáo môn học
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[210px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.filter(d => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tổng cộng</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{studentsProgress.length}</p>
            </div>
          </CardContent>
          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-slate-500 truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* PROGRESS LIST */}
      <div className="w-full">

        {/* TIẾN TRÌNH CHI TIẾT */}
        <Card className="w-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div className="text-left">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Bảng chi tiết Tiến độ Báo cáo & Chấm điểm
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                Giám sát tình trạng nộp bài, phân giảng viên chấm điểm thực tế
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>

          {/* STATUS TABS */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {(['all', 'CHUA_NOP', 'DA_NOP', 'DANG_CHAM', 'YEU_CAU_SUA', 'CHO_DUYET', 'HOAN_THANH', 'TU_CHOI'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedStatusTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${selectedStatusTab === tab
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/10'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                {tab === 'all' ? 'Tất cả' : getStatusText(tab as any)}
              </button>
            ))}
          </div>

          {/* DATA TABLE */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold border border-dashed rounded-xl">
              Không tìm thấy báo cáo nào phù hợp với bộ lọc hiện hành.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Thông tin Sinh viên & Nhóm</th>
                      <th className="pb-3">Lớp & Môn học</th>
                      <th className="pb-3">Giảng viên chấm chính</th>
                      <th className="pb-3">Cập nhật</th>
                      <th className="pb-3">Trạng thái</th>
                      <th className="pb-3 pr-2 text-right">Điểm hệ 10</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="group border-b border-slate-100/50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all text-xs font-semibold"
                      >
                        {/* Nhóm & MSSV */}
                        <td className="py-3.5 pl-2">
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{student.student}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{student.mssv}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{student.groupName}</span>
                            </div>
                          </div>
                        </td>

                        {/* Môn học */}
                        <td className="py-3.5">
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200">{student.code}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[150px] font-medium mt-0.5">{student.subject}</p>
                          </div>
                        </td>

                        {/* Giảng viên */}
                        <td className="py-3.5">
                          <p className="text-slate-600 dark:text-slate-400 font-extrabold">{student.lecturer}</p>
                        </td>

                        {/* Ngày nộp / Phiên bản */}
                        <td className="py-3.5">
                          <div>
                            <p className="text-slate-700 dark:text-slate-300 font-bold">{student.date}</p>
                            <span className="text-[9px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-1 py-0.5 rounded font-black mt-1 inline-block">{student.version}</span>
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border ${getStatusBadgeStyle(student.status)}`}>
                            {getStatusText(student.status)}
                          </span>
                        </td>

                        {/* Điểm số */}
                        <td className="py-3.5 pr-2 text-right">
                          <span className={`text-sm font-black ${student.score !== null ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {student.score !== null ? student.score.toFixed(1) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-400">
                  Hiển thị từ <span className="text-slate-700 dark:text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                  <span className="text-slate-700 dark:text-slate-300">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{' '}
                  trên tổng số <span className="text-slate-700 dark:text-slate-300">{totalItems}</span> bản ghi
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
