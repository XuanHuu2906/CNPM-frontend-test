import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Search,
  Sliders,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { teacherService } from '@/services/teacherService';
import type { Submission, Rubric } from '@/services/teacherService';

export default function GradingList() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingSubmissions, setFetchingSubmissions] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('HIDE_CHUA_NOP');

  // Load profiles and rubrics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, rubricsData] = await Promise.all([
          teacherService.getTeacherProfile(),
          teacherService.getRubrics()
        ]);

        setRubrics(rubricsData);

        const assignments = profileData.teacher?.assignments || [];
        if (assignments.length > 0) {
          const mappedClasses = assignments.map((a: any) => ({
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
        toast.error("Không thể tải thông tin phòng chấm điểm.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const hasRubrics = rubrics.length > 0;

  const mappedGroups = submissions.map((sub: any) => {
    let name = '';
    let topic = '';

    if (sub.group) {
      name = sub.group.name;
      topic = sub.group.topicName;
    } else if (sub.student) {
      name = `Cá nhân: ${sub.student.user.fullName}`;
      topic = 'Báo cáo cá nhân';
    }

    const score = sub.grades && sub.grades.length > 0 ? Number(sub.grades[0].finalScore) : null;

    return {
      id: sub.id,
      groupName: name,
      topic: topic || 'Chưa đăng ký đề tài',
      status: sub.status,
      submissionDate: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('vi-VN') : '',
      score,
      version: sub.version,
      members: sub.group?.members?.map((m: any) => m.student?.user?.fullName) || [],
    };
  });

  const getSubmitStatusBadge = (status: string) => {
    if (status === 'CHUA_NOP') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"><Clock className="w-3 h-3" /> Chưa nộp</span>;
    if (status === 'YEU_CAU_SUA') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-500 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900"><AlertCircle className="w-3 h-3" /> Yêu cầu sửa</span>;
    if (status === 'TU_CHOI') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900"><XCircle className="w-3 h-3" /> Từ chối</span>;
    if (status === 'DANG_CHAM') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"><Sparkles className="w-3 h-3" /> Đang chấm</span>;
    if (status === 'DA_CHAM') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900"><CheckCircle2 className="w-3 h-3" /> Đã chấm</span>;
    if (status === 'CHO_DUYET') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
    if (status === 'HOAN_THANH') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"><CheckCircle2 className="w-3 h-3" /> Hoàn thành</span>;

    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900"><CheckCircle2 className="w-3 h-3 animate-pulse" /> Đã nộp</span>;
  };

  const filteredGroups = mappedGroups.filter(g => {
    const matchesSearch = (g.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.groupName || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = false;
    if (statusFilter === 'HIDE_CHUA_NOP') {
      matchesStatus = g.status !== 'CHUA_NOP';
    } else if (statusFilter === 'ALL') {
      matchesStatus = true;
    } else {
      matchesStatus = g.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold">Đang chuẩn bị trạm chấm điểm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Chấm điểm báo cáo 📝
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Hàng đợi chấm điểm. Danh sách các bài báo cáo đã nộp cần bạn xử lý.
          </p>
        </div>
      </div>

      {classes.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`px-5 py-3.5 rounded-2xl border text-left shrink-0 transition-all duration-200 ${selectedClass === cls.id
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              <h4 className="font-bold text-sm">{cls.code}</h4>
              <p className={`text-xs mt-0.5 font-medium truncate max-w-[180px] ${selectedClass === cls.id ? 'text-indigo-100' : 'text-muted-foreground'}`}>
                {cls.name}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center text-amber-700 font-bold">
          Không tìm thấy lớp học phần.
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên nhóm, đề tài..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto self-stretch md:self-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-56 pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all text-slate-700"
          >
            <option value="HIDE_CHUA_NOP">Đang xử lý (Ẩn Chưa nộp)</option>
            <option value="ALL">Tất cả trạng thái (Bao gồm Chưa nộp)</option>
            <option value="CHUA_NOP">Chưa nộp</option>
            <option value="DA_NOP">Đã nộp</option>
            <option value="DANG_CHAM">Đang chấm</option>
            <option value="DA_CHAM">Đã chấm</option>
            <option value="YEU_CAU_SUA">Yêu cầu sửa</option>
            <option value="HOAN_THANH">Hoàn thành</option>
          </select>
        </div>
      </div>

      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-100/50 dark:shadow-none rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Hàng đợi chấm điểm</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {fetchingSubmissions ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6 w-24">Mã bài</th>
                    <th className="py-4 px-6 max-w-[200px]">Đề tài</th>
                    <th className="py-4 px-6 w-32">Nhóm</th>
                    <th className="py-4 px-6 w-32">Ngày nộp</th>
                    <th className="py-4 px-6 w-24">Phiên bản</th>
                    <th className="py-4 px-6 w-36">Trạng thái Rubric</th>
                    <th className="py-4 px-6 w-36">Trạng thái</th>
                    <th className="py-4 px-6 w-24">Điểm</th>
                    <th className="py-4 px-6 w-56 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => {
                      const isComplete = ['DA_CHAM', 'CHO_DUYET', 'HOAN_THANH'].includes(group.status);
                      const isDraft = group.status === 'DANG_CHAM';
                      const isUnsubmitted = group.status === 'CHUA_NOP';

                      return (
                        <tr key={group.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                          <td className="py-5 px-6 font-mono font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[100px]" title={group.id}>
                            {group.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-5 px-6 max-w-[200px]">
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-2">
                              {group.topic}
                            </p>
                          </td>
                          <td className="py-5 px-6 font-semibold text-slate-700 text-sm">
                            {group.groupName}
                          </td>
                          <td className="py-5 px-6 text-slate-500 dark:text-slate-400 text-sm font-medium">
                            {group.submissionDate || '--'}
                          </td>
                          <td className="py-5 px-6 text-slate-500 font-semibold text-sm">
                            v{group.version}
                          </td>
                          <td className="py-5 px-6">
                            {hasRubrics ? (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">Đã có Rubric</span>
                            ) : (
                              <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">Chưa có Rubric</span>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            {getSubmitStatusBadge(group.status)}
                          </td>
                          <td className="py-5 px-6">
                            {['DANG_CHAM', 'DA_CHAM', 'CHO_DUYET', 'HOAN_THANH'].includes(group.status) ? (
                              <span className="text-base font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-2.5 py-1 rounded-xl shadow-sm">
                                {group.score !== null ? group.score.toFixed(1) : '--'}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic font-normal text-sm">--</span>
                            )}
                          </td>
                          <td className="py-5 px-6 text-right space-x-2 whitespace-nowrap">
                            {isUnsubmitted && (
                              <button
                                onClick={() => toast.info('Đã ghi nhận yêu cầu nhắc nộp. Chức năng sẽ gửi thông báo khi module thông báo được tích hợp.')}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 rounded-xl text-xs font-bold shadow-sm transition-all"
                              >
                                <Bell className="w-3.5 h-3.5" />
                                Nhắc nộp
                              </button>
                            )}

                            {!isUnsubmitted && !hasRubrics && (
                              <button
                                onClick={() => navigate('/teacher/rubrics')}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold shadow-sm transition-all"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                Thiết kế Rubric
                              </button>
                            )}

                            {!isUnsubmitted && hasRubrics && (
                              <button
                                onClick={() => {
                                  navigate('/teacher/grading', {
                                    state: {
                                      submissionId: group.id,
                                      groupName: group.groupName,
                                      topic: group.topic,
                                      members: group.members,
                                      version: group.version,
                                      classId: selectedClass,
                                      readOnly: isComplete
                                    }
                                  });
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 ${isComplete ? 'bg-slate-700 hover:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700'
                                  }`}
                              >
                                {isComplete ? 'Xem kết quả' : isDraft ? 'Tiếp tục chấm' : 'Bắt đầu chấm'}
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        Không có bài nộp nào trong hàng đợi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
