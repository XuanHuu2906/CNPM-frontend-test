import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Filter,
  Search,
  Sliders,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  XCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { teacherService } from '@/services/teacherService';
import type { Submission } from '@/services/teacherService';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingSubmissions, setFetchingSubmissions] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State cho Xem chi tiết
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<any>(null);

  // Lấy danh sách lớp phân công từ profile giáo viên khi mount
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
          toast.warning("Tài khoản của bạn chưa được phân công lớp dạy nào!");
        }
      } catch (err) {
        toast.error("Không thể tải thông tin lớp học được phân công.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Lấy bài nộp khi lớp học được chọn thay đổi
  useEffect(() => {
    if (!selectedClass) return;

    const fetchSubmissions = async () => {
      try {
        setFetchingSubmissions(true);
        const data = await teacherService.getClassSubmissions(selectedClass);
        setSubmissions(data);
      } catch (err) {
        toast.error("Không thể tải danh sách bài nộp của lớp này.");
      } finally {
        setFetchingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [selectedClass]);

  // Đồng bộ hóa cấu trúc hiển thị sang nhóm/cá nhân
  const mappedGroups = submissions.map((sub: any) => {
    let name = '';
    let topic = '';
    let members: string[] = [];

    if (sub.group) {
      name = sub.group.name;
      topic = sub.group.topicName;
      members = (sub.group.members || sub.group.students || []).map(
        (m: any) => {
          const s = m.student || m;
          return `${s?.user?.fullName || 'Chưa có tên'} (MSSV: ${s?.studentCode || s?.user?.student?.studentCode || 'N/A'})`;
        }
      );
    } else if (sub.student) {
      name = `Cá nhân: ${sub.student?.user?.fullName || 'Chưa có tên'}`;
      topic = 'Báo cáo cá nhân';
      members = [`${sub.student?.user?.fullName || 'Chưa có tên'} (MSSV: ${sub.student?.studentCode || sub.student?.user?.student?.studentCode || 'N/A'})`];
    }

    const score = sub.grades && sub.grades.length > 0 ? Number(sub.grades[0].finalScore) : null;

    return {
      id: sub.id,
      groupName: name,
      topic: topic || 'Chưa đăng ký đề tài',
      members,
      status: sub.status,
      submissionDate: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('vi-VN') : '',
      score,
      version: sub.version,
    };
  });

  // Xuất bảng điểm CSV thực tế cho Excel (Hỗ trợ tiếng Việt có dấu hoàn hảo)
  const handleExportExcel = () => {
    if (mappedGroups.length === 0) {
      toast.warning("Không có dữ liệu điểm để kết xuất!");
      return;
    }

    const activeClass = classes.find(c => c.id === selectedClass);
    const className = activeClass ? activeClass.code : 'Lop_Hoc';

    let csvContent = "\uFEFF"; // UTF-8 BOM để Excel hiển thị tiếng Việt chuẩn
    csvContent += "Mã Bài Nộp,Tên Nhóm / Cá Nhân,Tên Đề Tài / Đồ Án,Thành Viên,Ngày Nộp,Trạng Thái,Điểm Số\n";

    mappedGroups.forEach(g => {
      const membersStr = g.members.join("; ");
      const showScore = ['DANG_CHAM', 'DA_CHAM', 'CHO_DUYET', 'HOAN_THANH'].includes(g.status);
      const scoreStr = (showScore && g.score !== null) ? g.score.toFixed(1) : "--";
      csvContent += `"${g.id}","${g.groupName}","${g.topic}","${membersStr}","${g.submissionDate}","${g.status}","${scoreStr}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bang_Diem_Lop_${className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Kết xuất bảng điểm lớp ${className} thành công!`);
  };

  const getSubmitStatusBadge = (status: string) => {
    if (status === 'CHUA_NOP') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"><Clock className="w-3 h-3" /> Chưa nộp</span>;
    } else if (status === 'YEU_CAU_SUA') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-500 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900"><AlertCircle className="w-3 h-3" /> Yêu cầu sửa</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900"><CheckCircle2 className="w-3 h-3 animate-pulse" /> Đã nộp</span>;
  };

  const getGradingStatusBadge = (status: string) => {
    if (status === 'CHUA_NOP' || status === 'YEU_CAU_SUA') return <span className="text-slate-400 italic font-normal text-sm">--</span>;
    if (status === 'DA_NOP') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">Chưa chấm</span>;
    if (status === 'DANG_CHAM') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"><Sparkles className="w-3 h-3" /> Đang chấm</span>;

    // DA_CHAM, CHO_DUYET, HOAN_THANH
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900"><CheckCircle2 className="w-3 h-3" /> Đã chấm</span>;
  };

  // Lọc dữ liệu dựa trên ô tìm kiếm & Bộ lọc trạng thái
  const filteredGroups = mappedGroups.filter(g => {
    const matchesSearch = (g.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.groupName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.members.some((m: string) => (m || '').toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold">Đang tải danh sách lớp phân công...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* TITLE & HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Quản lý Lớp học phần <span className="text-indigo-600 dark:text-indigo-400">🎓</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Quản lý tổng quan danh sách nhóm, thành viên và trạng thái nộp bài của sinh viên.
          </p>
        </div>
      </div>

      {/* CHOOSE ACTIVE CLASS TABS */}
      {classes.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => {
                setSelectedClass(cls.id);
                toast.info(`Đã chuyển sang lớp ${cls.code}`);
              }}
              className={`px-5 py-3.5 rounded-2xl border text-left shrink-0 transition-all duration-200 ${selectedClass === cls.id
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              <p className="text-xs opacity-75 font-semibold uppercase tracking-wider">{cls.term}</p>
              <h4 className="font-bold text-sm mt-1">{cls.code}</h4>
              <p className={`text-xs mt-0.5 font-medium truncate max-w-[180px] ${selectedClass === cls.id ? 'text-indigo-100' : 'text-muted-foreground'}`}>
                {cls.name}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-6 rounded-2xl text-center text-amber-700 dark:text-amber-400 font-bold">
          Không tìm thấy lớp học phần được phân công trong tài khoản của bạn.
        </div>
      )}

      {/* QUICK STATS CARDS */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-3xl font-black text-slate-700 dark:text-slate-200">{submissions.length}</span>
            <span className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Tổng nhóm</span>
          </div>
          <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-3xl font-black text-sky-600 dark:text-sky-400">
              {submissions.filter(s => ['DA_NOP', 'DANG_CHAM', 'DA_CHAM', 'CHO_DUYET', 'HOAN_THANH'].includes(s.status)).length}
            </span>
            <span className="text-xs font-semibold text-sky-600/70 dark:text-sky-400/70 mt-1 uppercase tracking-wider">Đã nộp</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-3xl font-black text-slate-600 dark:text-slate-300">
              {submissions.filter(s => ['CHUA_NOP', 'YEU_CAU_SUA'].includes(s.status)).length}
            </span>
            <span className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Chưa nộp</span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {submissions.filter(s => s.status === 'DANG_CHAM').length}
            </span>
            <span className="text-xs font-semibold text-amber-600/70 dark:text-amber-400/70 mt-1 uppercase tracking-wider">Đang chấm</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {submissions.filter(s => s.status === 'HOAN_THANH').length}
            </span>
            <span className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70 mt-1 uppercase tracking-wider">Hoàn thành</span>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH CONTROL BLOCK */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên nhóm, đề tài hoặc tên sinh viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>

        {/* Filter Selection */}
        <div className="flex items-center gap-2.5 w-full md:w-auto self-stretch md:self-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="CHUA_NOP">Chưa nộp</option>
            <option value="DA_NOP">Đã nộp</option>
            <option value="DANG_CHAM">Đang chấm</option>
            <option value="YEU_CAU_SUA">Yêu cầu sửa</option>
            <option value="DA_CHAM">Đã chấm</option>
            <option value="CHO_DUYET">Chờ duyệt</option>
            <option value="TU_CHOI">Từ chối</option>
            <option value="HOAN_THANH">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* STUDENT GROUP DIRECTORY LIST */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-100/50 dark:shadow-none rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Danh sách báo cáo & đồ án</CardTitle>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              {fetchingSubmissions ? 'Đang tải bài nộp...' : `Đang hiển thị ${filteredGroups.length} trong tổng số ${submissions.length} bài nộp`}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {fetchingSubmissions ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-slate-500 font-semibold">Đang tải danh sách bài báo cáo nộp...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6 w-32">Nhóm</th>
                    <th className="py-4 px-6">Đề tài / Đồ án</th>
                    <th className="py-4 px-6">Thành viên thực hiện</th>
                    <th className="py-4 px-6 w-36">Trạng thái nộp</th>
                    <th className="py-4 px-6 w-36">Trạng thái chấm</th>
                    <th className="py-4 px-6 w-24">Điểm số</th>
                    <th className="py-4 px-6 w-32 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                      <tr key={group.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="py-5 px-6 font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {group.groupName}
                        </td>
                        <td className="py-5 px-6 max-w-sm">
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors">
                            {group.topic}
                          </p>
                        </td>
                        <td className="py-5 px-6">
                          <ul className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {group.members.map((member, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full shrink-0" />
                                {member}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-5 px-6">
                          {getSubmitStatusBadge(group.status)}
                        </td>
                        <td className="py-5 px-6">
                          {getGradingStatusBadge(group.status)}
                        </td>
                        <td className="py-5 px-6">
                          {['DANG_CHAM', 'DA_CHAM', 'CHO_DUYET', 'HOAN_THANH'].includes(group.status) && group.score !== null ? (
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-2.5 py-1 rounded-xl shadow-sm">
                              {group.score.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-normal text-sm">--</span>
                          )}
                        </td>
                        <td className="py-5 px-6 text-right">
                          <button
                            onClick={() => setSelectedGroupDetails(group)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 dark:text-indigo-400 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 animate-pulse" />
                          <p className="text-slate-500 dark:text-slate-400 font-bold">Không tìm thấy bài nộp nào khớp bộ lọc!</p>
                          <p className="text-xs text-slate-400">Hãy thử điều chỉnh lại từ khóa hoặc bộ lọc trạng thái.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GROUP DETAIL MODAL */}
      {selectedGroupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Chi tiết nhóm</h3>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{selectedGroupDetails.groupName}</p>
                </div>
                <button
                  onClick={() => setSelectedGroupDetails(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Đề tài / Đồ án</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">{selectedGroupDetails.topic}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Thành viên thực hiện ({selectedGroupDetails.members.length})</p>
                  <ul className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    {selectedGroupDetails.members.map((m: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trạng thái nộp</p>
                    {getSubmitStatusBadge(selectedGroupDetails.status)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trạng thái chấm</p>
                    {getGradingStatusBadge(selectedGroupDetails.status)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Lần nộp gần nhất</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedGroupDetails.submissionDate || '--'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Điểm tổng quan</p>
                    <p className="font-black text-indigo-600 dark:text-indigo-400 text-base">{['DANG_CHAM', 'DA_CHAM', 'CHO_DUYET', 'HOAN_THANH'].includes(selectedGroupDetails.status) && selectedGroupDetails.score !== null ? selectedGroupDetails.score.toFixed(1) : '--'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setSelectedGroupDetails(null)}
                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
