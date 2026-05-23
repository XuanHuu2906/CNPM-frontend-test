import { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  UserPlus, 
  Lock, 
  Unlock, 
  Shuffle, 
  Search, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { academicService } from '../../services/academicService';
import { adminService } from '../../services/adminService';

interface CourseClass {
  id: string;
  code: string;
  subject: string;
  subjectId: string;
  termId: string;
  department: string;
  registeredStudents: number;
  lecturer: string | null; 
  lecturerId: string | null;
  room: string;
  schedule: string;
}

interface TeacherOption {
  id: string;
  name: string;
  code: string;
  dept: string;
  currentLoad: number;
}

export default function AcademicAssignment() {
  // 1. Quản lý trạng thái khóa học kỳ (Đồng bộ trực tiếp từ localStorage)
  const [isSemesterLocked, setIsSemesterLocked] = useState<boolean>(() => {
    return localStorage.getItem('academic-semester-locked') === 'true';
  });

  const [courseClasses, setCourseClasses] = useState<CourseClass[]>([]);
  const [availableLecturers, setAvailableLecturers] = useState<TeacherOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States phục vụ Tìm kiếm & Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Bộ lọc Học kỳ (Semesters) và Môn học (Subjects)
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');

  // Lớp học phần & Giảng viên
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedLecturerId, setSelectedLecturerId] = useState('all');

  // Các filter ít dùng & Trạng thái phân công
  const [selectedAssignStatus, setSelectedAssignStatus] = useState('all'); // all | assigned | unassigned
  const [sortBy, setSortBy] = useState('code-asc'); // code-asc | code-desc | students-desc | load-asc

  // Trạng thái đóng/mở bộ lọc nâng cao
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal Phân công (Assign/Reassign)
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<CourseClass | null>(null);
  const [targetLecturerId, setTargetLecturerId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // States phục vụ Đề xuất Phân công
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Nhật ký điều phối (Lưu trữ trong LocalStorage)
  const [assignmentLogs, setAssignmentLogs] = useState<any[]>(() => {
    const savedLogs = localStorage.getItem('academic-assignment-logs');
    if (savedLogs) {
      try {
        return JSON.parse(savedLogs);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        time: '09:30',
        date: '19/05/2026',
        user: 'Nguyễn Đào Tạo',
        action: 'Đã đổi giảng viên chấm chính lớp INT3307_1 từ ThS. Nguyễn Văn B sang PGS.TS Nguyễn Văn A.',
        reason: 'Giảng viên cũ nghỉ đột xuất.'
      }
    ];
  });

  // Tự động lưu logs khi thay đổi
  useEffect(() => {
    localStorage.setItem('academic-assignment-logs', JSON.stringify(assignmentLogs));
  }, [assignmentLogs]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [classesData, usersData, termsData, subjectsData] = await Promise.all([
        academicService.getAllClasses(),
        adminService.getAllUsers(),
        academicService.getAllTerms(),
        academicService.getAllSubjects()
      ]);

      setTerms(termsData);
      setAllSubjects(subjectsData);

      // Trích xuất danh sách giảng viên
      const teachersList: TeacherOption[] = usersData
        .filter((u: any) => u.role === 'TEACHER' && u.teacher)
        .map((u: any) => {
          // Tính toán tải trọng (số lớp đã phân công)
          const loadCount = classesData.filter((c: any) => 
            c.assignments?.some((a: any) => a.teacherId === u.teacher.id)
          ).length;

          // Xác định bộ môn
          const dept = u.email.includes('httt') ? 'HTTT' : u.email.includes('ktmt') ? 'KTMT' : 'CNPM';

          return {
            id: u.teacher.id,
            name: u.fullName,
            code: u.teacher.teacherCode,
            dept,
            currentLoad: loadCount
          };
        });

      setAvailableLecturers(teachersList);

      // Map danh sách lớp học phần
      const mappedClasses: CourseClass[] = classesData.map((cls: any, index: number) => {
        const assignments = cls.assignments || [];

        return {
          id: cls.id,
          code: cls.classCode,
          subject: cls.subject?.name || 'N/A',
          subjectId: cls.subjectId || '',
          termId: cls.termId || '',
          department: cls.subject?.subjectCode?.substring(0, 4)?.toUpperCase()?.includes('SE') ? 'CNPM' : cls.subject?.subjectCode?.substring(0, 4)?.toUpperCase()?.includes('IS') ? 'HTTT' : 'KTMT',
          registeredStudents: cls.students?.length || 0,
          lecturer: assignments[0]?.teacher?.user?.fullName || null,
          lecturerId: assignments[0]?.teacher?.id || null,
          room: '—',
          schedule: '—'
        };
      });

      setCourseClasses(mappedClasses);

    } catch (error: any) {
      toast.error(`Không thể tải dữ liệu phân công: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý thay đổi Bộ môn / Môn học từ Giao diện chính
  const handleMainDeptOrSubjectChange = (val: string) => {
    if (val === 'all') {
      setSelectedDept('all');
      setSelectedSubjectId('all');
    } else if (val.startsWith('dept:')) {
      const dept = val.replace('dept:', '');
      setSelectedDept(dept);
      setSelectedSubjectId('all');
    } else if (val.startsWith('subject:')) {
      const subId = val.replace('subject:', '');
      const sub = allSubjects.find(s => s.id === subId);
      if (sub) {
        // Xác định bộ môn của môn học
        const codePrefix = sub.subjectCode.substring(0, 4).toUpperCase();
        let dept = 'CNPM';
        if (codePrefix.includes('SE')) dept = 'CNPM';
        else if (codePrefix.includes('IS')) dept = 'HTTT';
        else dept = 'KTMT';
        
        setSelectedDept(dept);
        setSelectedSubjectId(subId);
      }
    }
  };

  // Reset các bộ lọc khi selectedTerm thay đổi
  useEffect(() => {
    setSelectedClassId('all');
  }, [selectedTerm]);

  // Bộ lọc dữ liệu bảng
  const filteredClasses = courseClasses.filter(c => {
    // 1. Tìm kiếm nhanh
    const matchesSearch = 
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Học kỳ (Semester)
    const matchesTerm = selectedTerm === 'all' || c.termId === selectedTerm;

    // 3. Bộ môn (Department)
    const matchesDept = selectedDept === 'all' || c.department === selectedDept;

    // 4. Lớp học phần (Course Class)
    const matchesClass = selectedClassId === 'all' || c.id === selectedClassId;

    // 5. Giảng viên chấm chính (Lecturer)
    const matchesLecturer = selectedLecturerId === 'all' || c.lecturerId === selectedLecturerId;

    // 6. Môn học (Subject - Chỉ áp dụng khi đã chọn Bộ môn trước đó)
    const matchesSubject = (selectedDept === 'all' || selectedSubjectId === 'all') || c.subjectId === selectedSubjectId;

    // 7. Trạng thái phân công (Assignment Status)
    let matchesAssignStatus = true;
    if (selectedAssignStatus === 'assigned') {
      matchesAssignStatus = !!c.lecturerId;
    } else if (selectedAssignStatus === 'unassigned') {
      matchesAssignStatus = !c.lecturerId;
    }

    return matchesSearch && matchesTerm && matchesDept && matchesClass && matchesLecturer && matchesSubject && matchesAssignStatus;
  });

  // Sắp xếp dữ liệu bảng
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    if (sortBy === 'code-asc') {
      return a.code.localeCompare(b.code);
    } else if (sortBy === 'code-desc') {
      return b.code.localeCompare(a.code);
    } else if (sortBy === 'students-desc') {
      return b.registeredStudents - a.registeredStudents;
    } else if (sortBy === 'load-asc') {
      // Sắp xếp theo số lượng tải của giảng viên chấm chính tăng dần
      const loadA = availableLecturers.find(l => l.id === a.lecturerId)?.currentLoad || 0;
      const loadB = availableLecturers.find(l => l.id === b.lecturerId)?.currentLoad || 0;
      return loadA - loadB;
    }
    return 0;
  });

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedTerm, selectedClassId, selectedLecturerId, selectedSubjectId, selectedAssignStatus, sortBy]);

  // Phân trang
  const totalItems = sortedClasses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedClasses = sortedClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Danh sách Lớp học phần hiển thị trong Select (phục vụ bộ lọc "Chọn lớp học phần")
  // Lọc động theo Học kỳ và Bộ môn đã chọn
  const classDropdownOptions = courseClasses.filter(c => {
    const matchesTerm = selectedTerm === 'all' || c.termId === selectedTerm;
    const matchesDept = selectedDept === 'all' || c.department === selectedDept;
    return matchesTerm && matchesDept;
  });

  // Danh sách Môn học lọc động theo Bộ môn đã chọn
  const subjectDropdownOptions = allSubjects.filter(sub => {
    if (selectedDept === 'all') return true;
    const codePrefix = sub.subjectCode.substring(0, 4).toUpperCase();
    if (selectedDept === 'CNPM') return codePrefix.includes('SE');
    if (selectedDept === 'HTTT') return codePrefix.includes('IS');
    if (selectedDept === 'KTMT') return !codePrefix.includes('SE') && !codePrefix.includes('IS');
    return true;
  });

  // Mở khóa/Khóa học kỳ
  const handleToggleSemesterLock = () => {
    const newLockState = !isSemesterLocked;
    setIsSemesterLocked(newLockState);
    localStorage.setItem('academic-semester-locked', String(newLockState));
    
    // Dispatch storage event
    window.dispatchEvent(new Event('storage'));

    if (newLockState) {
      toast.success('🔒 Đã Khóa Học Kỳ Hiện Tại! Toàn bộ dữ liệu điểm số và thông tin giảng viên đã được đóng băng.');
    } else {
      toast.info('🔓 Đã Mở Khóa Học Kỳ! Bạn có thể thực hiện phân công và điều phối bình thường.');
    }
  };

  // Mở Modal Phân công
  const handleOpenAssignModal = (cls: CourseClass) => {
    if (isSemesterLocked) {
      toast.error('Chặn Tác vụ! Học kỳ hiện tại đã khóa kết quả. Không thể điều chỉnh phân công giảng dạy.');
      return;
    }
    setSelectedClassForAssign(cls);
    setTargetLecturerId(cls.lecturerId || '');
    setAdjustmentReason('');
    setIsReassigning(!!cls.lecturerId);
  };

  // Xác nhận lưu phân công giảng viên thực tế vào Postgres
  const handleConfirmAssignment = async () => {
    if (!selectedClassForAssign) return;

    if (!targetLecturerId) {
      toast.error('Vui lòng chọn giảng viên cụ thể để phân công!');
      return;
    }

    if (!adjustmentReason.trim()) {
      toast.error('Vui lòng cung cấp lý do điều chỉnh / phân công!');
      return;
    }

    try {
      toast.loading('Đang ghi nhận dữ liệu phân công...', { id: 'assign-action' });

      // Nếu đã có phân công trước đó, tiến hành xóa (unassign) trước khi gán mới
      const previousLecturerId = selectedClassForAssign.lecturerId;
      const previousLecturerName = selectedClassForAssign.lecturer;

      if (previousLecturerId && previousLecturerId !== targetLecturerId) {
        try {
          await academicService.unassignTeacher(selectedClassForAssign.id, previousLecturerId);
        } catch (err) {
          // Bỏ qua lỗi nếu bản ghi cũ không tìm thấy
        }
      }

      // Thêm phân công mới
      await academicService.assignTeacher({
        classId: selectedClassForAssign.id,
        teacherId: targetLecturerId
      });

      const selectedTeacherName = availableLecturers.find(l => l.id === targetLecturerId)?.name || 'Giảng viên';

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('vi-VN');

      let actionText = '';
      if (previousLecturerId && previousLecturerName) {
        actionText = `Đã đổi giảng viên chấm chính lớp ${selectedClassForAssign.code} từ ${previousLecturerName} sang ${selectedTeacherName}.`;
      } else {
        actionText = `Đã phân công giảng viên chấm chính ${selectedTeacherName} cho lớp ${selectedClassForAssign.code}.`;
      }

      const newLog = {
        time: timeStr,
        date: dateStr,
        user: 'Phòng đào tạo',
        action: actionText,
        reason: adjustmentReason
      };
      setAssignmentLogs([newLog, ...assignmentLogs]);

      toast.success(previousLecturerId ? `Đã thay đổi giảng viên chấm chính thành công!` : `Đã phân công giảng viên chấm chính thành công!`, { id: 'assign-action' });
      setSelectedClassForAssign(null);

      // Reload bảng
      loadData();
    } catch (error: any) {
      toast.error(`Không thể thực thi phân công: ${error.message}`, { id: 'assign-action' });
    }
  };

  // Tính toán Đề xuất phân công hợp lệ (không lưu ngay xuống Postgres)
  const handleGenerateRecommendations = () => {
    if (isSemesterLocked) {
      toast.error('Chặn Tác vụ! Học kỳ đã bị khóa kết quả bảo mật.');
      return;
    }

    if (courseClasses.length === 0 || availableLecturers.length === 0) {
      toast.warning('Không có dữ liệu hợp lệ để đề xuất.');
      return;
    }

    // Lọc các lớp chưa được phân bổ giảng viên
    const classesToAssign = courseClasses.filter(c => !c.lecturerId);

    if (classesToAssign.length === 0) {
      toast.info('Tất cả các lớp đã được phân bổ giảng viên đầy đủ!');
      return;
    }

    const tempLecturers = availableLecturers.map(t => ({ ...t }));
    const calculatedRecommendations: any[] = [];

    for (const cls of classesToAssign) {
      // Tìm giảng viên phù hợp bộ môn và có tải trọng thấp nhất
      const eligibleTeachers = tempLecturers
        .filter(t => t.dept === cls.department)
        .sort((a, b) => a.currentLoad - b.currentLoad);

      if (eligibleTeachers.length > 0) {
        const primaryTeacher = eligibleTeachers[0];
        primaryTeacher.currentLoad++; // Cộng dồn tải trọng giả định để phân bổ tiếp theo
        
        calculatedRecommendations.push({
          classId: cls.id,
          classCode: cls.code,
          subject: cls.subject,
          department: cls.department,
          teacherId: primaryTeacher.id,
          teacherName: primaryTeacher.name,
          reason: 'Phân công đề xuất tự động theo tải trọng giảng viên'
        });
      }
    }

    if (calculatedRecommendations.length === 0) {
      toast.info('Không tìm thấy đề xuất giảng viên phù hợp cho các lớp chưa phân công.');
      return;
    }

    setRecommendations(calculatedRecommendations);
    setIsRecommendModalOpen(true);
  };

  // Áp dụng đề xuất đơn lẻ
  const handleApplySingleRecommendation = async (index: number) => {
    const rec = recommendations[index];
    try {
      toast.loading(`Đang phân công lớp ${rec.classCode}...`, { id: `rec-apply-${index}` });
      await academicService.assignTeacher({
        classId: rec.classId,
        teacherId: rec.teacherId
      });

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('vi-VN');

      const newLog = {
        time: timeStr,
        date: dateStr,
        user: 'Phòng đào tạo',
        action: `Đã đề xuất và phân công giảng viên chấm chính ${rec.teacherName} cho lớp ${rec.classCode}.`,
        reason: rec.reason
      };

      setAssignmentLogs(prev => [newLog, ...prev]);
      toast.success(`Đã áp dụng thành công lớp ${rec.classCode}`, { id: `rec-apply-${index}` });

      const updated = [...recommendations];
      updated.splice(index, 1);
      setRecommendations(updated);

      if (updated.length === 0) {
        setIsRecommendModalOpen(false);
      }

      loadData();
    } catch (error: any) {
      toast.error(`Lỗi phân công lớp ${rec.classCode}: ${error.message}`, { id: `rec-apply-${index}` });
    }
  };

  // Áp dụng đồng loạt tất cả đề xuất
  const handleApplyAllRecommendations = async () => {
    if (recommendations.length === 0) return;

    try {
      toast.loading('Đang áp dụng đồng loạt đề xuất phân công...', { id: 'rec-apply-all' });
      let successCount = 0;
      const newLogs: any[] = [];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('vi-VN');

      for (const rec of recommendations) {
        try {
          await academicService.assignTeacher({
            classId: rec.classId,
            teacherId: rec.teacherId
          });
          successCount++;
          newLogs.push({
            time: timeStr,
            date: dateStr,
            user: 'Phòng đào tạo',
            action: `Đã đề xuất và phân công giảng viên chấm chính ${rec.teacherName} cho lớp ${rec.classCode}.`,
            reason: rec.reason
          });
        } catch (err) {
          // Bỏ qua nếu có lớp lỗi
        }
      }

      setAssignmentLogs(prev => [...newLogs, ...prev]);
      toast.success(`Đã áp dụng thành công ${successCount}/${recommendations.length} đề xuất!`, { id: 'rec-apply-all' });
      setIsRecommendModalOpen(false);
      setRecommendations([]);
      loadData();
    } catch (error: any) {
      toast.error(`Lỗi khi áp dụng đề xuất: ${error.message}`, { id: 'rec-apply-all' });
    }
  };

  const handleRecommendationReasonChange = (index: number, newReason: string) => {
    const updated = [...recommendations];
    updated[index] = { ...updated[index], reason: newReason };
    setRecommendations(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      
      {/* HEADER SECTION WITH LOCK TOGGLE SIMULATOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Điều phối Giảng viên Chấm Báo cáo <GitPullRequest className="w-8 h-8 text-indigo-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Chỉ định hoặc điều chỉnh giảng viên chấm chính cho từng lớp học phần.
          </p>
        </div>

        {/* LOCK SEMESTER STATUS BAR BUTTON */}
        <button
          onClick={handleToggleSemesterLock}
          className={`px-4.5 py-2.5 rounded-2xl text-xs font-black tracking-wide cursor-pointer transition-all flex items-center gap-2 shadow-md ${
            isSemesterLocked
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
          }`}
        >
          {isSemesterLocked ? (
            <>
              <Lock className="w-4 h-4 shrink-0" />
              Học kỳ đang khóa
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4 shrink-0" />
              Học kỳ đang mở
            </>
          )}
        </button>
      </div>

      {/* SEMESTER LOCKED WARNING BANNER */}
      {isSemesterLocked && (
        <div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 rounded-xl flex items-start gap-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
          <div className="text-xs font-semibold leading-relaxed">
            <h5 className="font-extrabold uppercase tracking-wide">Cảnh báo Học kỳ Đã Khóa (Lock Semester)</h5>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Phòng Đào tạo đã khóa học kỳ để tiến hành tổng kết điểm số. Mọi quyền cập nhật thông tin lớp và chỉ định giảng viên phụ trách đã bị **Đóng băng bảo mật**. Hãy mở khóa học kỳ ở góc trên bên phải nếu cần điều chỉnh.
            </p>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <Card className="border border-slate-200/85 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-5 space-y-4">
        
        {/* MAIN FILTER DISPLAY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
          {/* 1. Chọn học kỳ */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">1. Học Kỳ</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none transition-all focus:border-indigo-500"
            >
              <option value="all">Tất cả Học kỳ</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isLocked ? '(Đang khóa 🔒)' : '(Đang mở 🔓)'}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn bộ môn hoặc môn học */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">2. Bộ Môn / Môn Học</label>
            <select
              value={
                selectedSubjectId !== 'all'
                  ? `subject:${selectedSubjectId}`
                  : selectedDept !== 'all'
                  ? `dept:${selectedDept}`
                  : 'all'
              }
              onChange={(e) => handleMainDeptOrSubjectChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none transition-all focus:border-indigo-500"
            >
              <option value="all">Tất cả Bộ môn & Môn học</option>
              <optgroup label="— BỘ MÔN —">
                <option value="dept:CNPM">Công nghệ Phần mềm (CNPM)</option>
                <option value="dept:HTTT">Hệ thống Thông tin (HTTT)</option>
                <option value="dept:KTMT">Kỹ thuật Máy tính (KTMT)</option>
              </optgroup>
              <optgroup label="— MÔN HỌC —">
                {allSubjects.map((sub) => (
                  <option key={sub.id} value={`subject:${sub.id}`}>
                    {sub.subjectCode} - {sub.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 3. Chọn lớp học phần */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">3. Lớp Học Phần</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none transition-all focus:border-indigo-500"
            >
              <option value="all">Tất cả Lớp học phần ({classDropdownOptions.length})</option>
              {classDropdownOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.subject}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Tìm kiếm nhanh */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">4. Tìm Kiếm Nhanh</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Mã lớp, tên môn học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
              />
            </div>
          </div>
        </div>

        {/* CONTROLS ROW: TOGGLE ADVANCED FILTERS & ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <button
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAdvancedFiltersOpen
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Bộ lọc nâng cao
              {isAdvancedFiltersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Clear filters shortcut */}
            {(selectedTerm !== 'all' || selectedDept !== 'all' || selectedClassId !== 'all' || searchQuery || selectedLecturerId !== 'all' || selectedSubjectId !== 'all' || selectedAssignStatus !== 'all') && (
              <button
                onClick={() => {
                  setSelectedTerm('all');
                  setSelectedDept('all');
                  setSelectedClassId('all');
                  setSearchQuery('');
                  setSelectedLecturerId('all');
                  setSelectedSubjectId('all');
                  setSelectedAssignStatus('all');
                  setSortBy('code-asc');
                }}
                className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Đặt lại bộ lọc
              </button>
            )}
          </div>

          <button
            onClick={handleGenerateRecommendations}
            disabled={isSemesterLocked}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto ${
              isSemesterLocked
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
            }`}
          >
            <Shuffle className="w-4 h-4 shrink-0" />
            Đề xuất phân công
          </button>
        </div>

        {/* COLLAPSIBLE ADVANCED FILTERS PANEL */}
        {isAdvancedFiltersOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 p-4 rounded-xl animate-in slide-in-from-top duration-300">
            
            {/* 1. Giảng viên chấm chính */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Giảng viên chấm chính</label>
              <select
                value={selectedLecturerId}
                onChange={(e) => setSelectedLecturerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none transition-all"
              >
                <option value="all">Tất cả Giảng viên</option>
                {availableLecturers.map((lect) => (
                  <option key={lect.id} value={lect.id}>
                    {lect.name} ({lect.dept}) - {lect.currentLoad} lớp
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Môn học (Chỉ hiển thị khi đã chọn Bộ môn trước đó) */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Môn Học (Bộ lọc động)</label>
              {selectedDept === 'all' ? (
                <div className="px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-950 text-[11px] font-semibold text-slate-400 italic">
                  Vui lòng chọn Bộ môn ở hiển thị chính
                </div>
              ) : (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none transition-all"
                >
                  <option value="all">Tất cả Môn học ({subjectDropdownOptions.length})</option>
                  {subjectDropdownOptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subjectCode} - {sub.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Trạng thái phân công */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Trạng thái phân công</label>
              <select
                value={selectedAssignStatus}
                onChange={(e) => setSelectedAssignStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none transition-all"
              >
                <option value="all">Tất cả Trạng thái</option>
                <option value="assigned">Đã phân công giảng viên</option>
                <option value="unassigned">Chưa phân công giảng viên</option>
              </select>
            </div>

            {/* 4. Sắp xếp thứ tự */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Sắp xếp theo</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none transition-all"
              >
                <option value="code-asc">Mã lớp học phần (A-Z) ↑</option>
                <option value="code-desc">Mã lớp học phần (Z-A) ↓</option>
                <option value="students-desc">Số lượng sinh viên giảm dần ↓</option>
                <option value="load-asc">Tải chấm giảng viên tăng dần ↑</option>
              </select>
            </div>

          </div>
        )}
      </Card>

      {/* CORE ASSIGNMENT TABLE & LOG TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ASSIGNMENT TABLE */}
        <Card className="lg:col-span-8 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg rounded-2xl overflow-hidden text-left">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-base">Danh sách Lớp học phần & Phân công Giảng viên</h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Phân công chấm điểm & giám sát điểm số toàn học khoa</p>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Layers className="w-10 h-10 stroke-1 text-slate-300 mb-1" />
                <p className="text-sm font-bold">Không tìm thấy lớp học phần phù hợp bộ lọc!</p>
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/20 dark:bg-slate-950/10">
                      <th className="py-4 px-5">Mã & Môn học</th>
                      <th className="py-4 px-4">Thông tin lớp</th>
                      <th className="py-4 px-4">Giảng viên chấm chính</th>
                      <th className="py-4 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {paginatedClasses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/30 transition-all">
                        <td className="py-4 px-5 text-left">
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 rounded text-[9px] font-extrabold mb-1 inline-block">
                            {c.code}
                          </span>
                          <div className="text-slate-800 dark:text-slate-150 font-bold max-w-[180px] line-clamp-1">{c.subject}</div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Bộ môn: {c.department}</div>
                        </td>

                        <td className="py-4 px-4 text-left">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>P.{c.room}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{c.schedule}</span>
                          </div>
                        </td>

                        {/* Primary Lecturer */}
                        <td className="py-4 px-4 text-left">
                          {c.lecturer ? (
                            <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-150/40 dark:border-slate-800">{c.lecturer}</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 font-semibold italic">Chưa phân công</span>
                          )}
                        </td>

                        {/* Thao tác action column */}
                        <td className="py-4 px-4 text-center">
                          {isSemesterLocked ? (
                            <button
                              disabled
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-not-allowed border border-slate-200 dark:border-slate-750"
                            >
                              <Lock className="w-3 h-3" />
                              Xem chi tiết
                            </button>
                          ) : c.lecturer ? (
                            <button
                              onClick={() => handleOpenAssignModal(c)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-950/60 rounded-lg text-[10px] font-bold cursor-pointer transition-all border border-indigo-100 dark:border-indigo-900/50"
                            >
                              Đổi giảng viên
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenAssignModal(c)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/60 rounded-lg text-[10px] font-bold cursor-pointer transition-all border border-emerald-100 dark:border-emerald-900/50 inline-flex items-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Phân công
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* PAGINATION CONTROLS */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Hiển thị <strong className="text-slate-700 dark:text-slate-300">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)}</strong> trong tổng số <strong className="text-indigo-600 dark:text-indigo-400">{totalItems}</strong> lớp học phần
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          currentPage === idx + 1
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* LOG TIMELINE */}
        <Card className="lg:col-span-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg rounded-2xl p-5 flex flex-col text-left">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <h3 className="font-bold text-slate-850 dark:text-slate-200 text-base">Nhật ký Phân công Gần đây</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Lịch sử điều động & chỉ định giảng viên thực tế</p>
          </div>

          <div className="space-y-4 flex-1 mt-4 relative overflow-y-auto max-h-[450px] pr-1 scrollbar-thin">
            <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-slate-100 dark:bg-slate-800" />
            
            {assignmentLogs.map((log, idx) => (
              <div key={idx} className="flex gap-4 relative pl-7 text-xs">
                <div className="absolute left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                <div className="space-y-1.5 text-left flex-1 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-850/50">
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-extrabold uppercase">
                    <span>{log.user}</span>
                    <span>{log.time} {log.date ? ' • ' + log.date : ''}</span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed text-[11px]">
                    {log.action}
                  </p>
                  {log.reason && (
                    <div className="mt-1 pt-1.5 border-t border-dashed border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex flex-col">
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-black">Lý do điều chỉnh:</span>
                      <span className="mt-0.5 text-slate-600 dark:text-slate-350 italic">"{log.reason}"</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* ASSIGNMENT DIALOG MODAL */}
      {selectedClassForAssign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left text-slate-800 dark:text-slate-100">
            <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <UserPlus className="w-5 h-5 shrink-0" />
              Điều động & Phân công Giảng dạy
            </h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Bạn đang điều phối giảng viên chấm báo cáo cho lớp học phần dưới đây. Hãy kiểm tra thông tin và chọn giảng viên phù hợp cùng bộ môn.
            </p>
            
            {/* Readonly Class details */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150/40 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="col-span-2">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block">Lớp học phần:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedClassForAssign.code} - {selectedClassForAssign.subject}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block">Bộ môn phụ trách:</span>
                <span className="text-slate-850 dark:text-slate-200 font-extrabold">{selectedClassForAssign.department}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block">Giảng viên chấm chính:</span>
                <span className="text-slate-850 dark:text-slate-200 font-extrabold">{selectedClassForAssign.lecturer || 'Chưa phân công'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Chọn Giảng viên Đảm nhận (Cùng bộ môn)</label>
              <select
                value={targetLecturerId}
                onChange={(e) => setTargetLecturerId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
              >
                <option value="">-- Chọn giảng viên --</option>
                {availableLecturers
                  .filter(lect => lect.dept === selectedClassForAssign.department)
                  .map((lect) => (
                    <option key={lect.id} value={lect.id}>
                      {lect.name} ({lect.dept}) - Đang chấm: {lect.currentLoad} lớp
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">
                Lý do điều chỉnh / Phân công <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Nhập lý do chi tiết (ví dụ: Thay đổi theo phân bổ bộ môn, Giảng viên cũ bận đột xuất...)"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-355 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedClassForAssign(null)}
                className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer text-slate-600 dark:text-slate-400"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmAssignment}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md cursor-pointer"
              >
                Xác nhận phân công
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDATION PREVIEW MODAL */}
      {isRecommendModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left text-slate-800 dark:text-slate-100 max-h-[90vh] flex flex-col">
            <div className="shrink-0 space-y-1">
              <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Shuffle className="w-5 h-5 shrink-0" />
                Đề xuất Phân công Giảng viên Chấm Báo cáo
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Hệ thống tự động đề xuất giảng viên phù hợp nhất dựa trên bộ môn và tải trọng giảng dạy tối thiểu. Hãy kiểm tra, chỉnh sửa lý do và xác nhận để áp dụng.
              </p>
            </div>

            {/* Recommendations List Container */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 my-2 min-h-[200px] scrollbar-thin">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150/40 dark:border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 rounded text-[9px] font-extrabold">
                        {rec.classCode}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{rec.subject}</span>
                      <span className="text-[10px] text-slate-400 font-bold">({rec.department})</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Đề xuất giảng viên: <span className="font-extrabold text-slate-800 dark:text-slate-200">{rec.teacherName}</span>
                    </div>
                  </div>

                  {/* Inline Reason Edit */}
                  <div className="flex-1 min-w-[240px]">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block mb-1">Lý do phân công:</span>
                    <input
                      type="text"
                      value={rec.reason}
                      onChange={(e) => handleRecommendationReasonChange(index, e.target.value)}
                      placeholder="Nhập lý do phân công..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none"
                    />
                  </div>

                  {/* Individual Apply Action */}
                  <div className="shrink-0 flex items-center">
                    <button
                      onClick={() => handleApplySingleRecommendation(index)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsRecommendModalOpen(false);
                  setRecommendations([]);
                }}
                className="px-4 py-2.5 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer text-slate-600 dark:text-slate-400"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleApplyAllRecommendations}
                className="px-4 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer"
              >
                Áp dụng đồng loạt ({recommendations.length})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
