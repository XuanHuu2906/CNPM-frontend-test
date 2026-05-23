import { useState, useEffect } from 'react';
import {
  Users, UserPlus, FileText, Trash2, Edit3,
  RefreshCw, Plus, CheckCircle, Search,
  Settings2, ChevronRight, Wand2, UploadCloud, Check, X
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { teacherService } from '../../services/teacherService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function GroupManagement() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const [groups, setGroups] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTopic, setNewGroupTopic] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Excel import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const [isAutoGroupModalOpen, setIsAutoGroupModalOpen] = useState(false);
  const [targetSize, setTargetSize] = useState(4);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const data = await teacherService.getAssignedClassSections();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (error: any) {
      toast.error('Lỗi tải danh sách lớp: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassData = async (classId: string) => {
    if (!classId) return;
    try {
      setIsLoading(true);
      const [groupsData, studentsData] = await Promise.all([
        teacherService.getGroupsByClassId(classId),
        teacherService.getStudentsByClassId(classId)
      ]);
      setGroups(groupsData);
      setStudents(studentsData);
    } catch (error: any) {
      toast.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassData(selectedClassId);
    }
  }, [selectedClassId]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Tên nhóm không được để trống');
      return;
    }
    try {
      toast.loading('Đang tạo nhóm...', { id: 'create-group' });
      await teacherService.createGroup(selectedClassId, {
        name: newGroupName,
        topicName: newGroupTopic,
        studentIds: selectedStudentIds
      });
      toast.success('Tạo nhóm thành công', { id: 'create-group' });
      setIsCreateModalOpen(false);
      setNewGroupName('');
      setNewGroupTopic('');
      setSelectedStudentIds([]);
      loadClassData(selectedClassId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message, { id: 'create-group' });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này? Các sinh viên trong nhóm sẽ trở về trạng thái chưa có nhóm.')) return;

    try {
      toast.loading('Đang xóa nhóm...', { id: 'delete-group' });
      await teacherService.deleteGroup(groupId);
      toast.success('Đã xóa nhóm', { id: 'delete-group' });
      loadClassData(selectedClassId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message, { id: 'delete-group' });
    }
  };

  const handleAddMember = async (groupId: string, studentId: string) => {
    try {
      await teacherService.addMember(groupId, studentId);
      toast.success('Thêm thành viên thành công');
      loadClassData(selectedClassId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleRemoveMember = async (groupId: string, studentId: string) => {
    try {
      await teacherService.removeMember(groupId, studentId);
      toast.success('Gỡ thành viên thành công');
      loadClassData(selectedClassId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setImportFile(file);
    processExcelFile(file);
  };

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(ab, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

        const groupMap = new Map<string, { name: string, topicName: string, studentCodes: Set<string> }>();

        rows.forEach(row => {
          const mssv = String(row['MSSV'] || '').trim();
          const tenNhom = String(row['Tên nhóm'] || '').trim();
          const deTai = String(row['Đề tài'] || '').trim();

          if (!tenNhom || !mssv) return;

          if (!groupMap.has(tenNhom)) {
            groupMap.set(tenNhom, { name: tenNhom, topicName: deTai, studentCodes: new Set() });
          }
          groupMap.get(tenNhom)!.studentCodes.add(mssv);
        });

        const groupsArray = Array.from(groupMap.values()).map(g => ({
          name: g.name,
          topicName: g.topicName,
          studentCodes: Array.from(g.studentCodes)
        }));

        setImportPreview(groupsArray);
      } catch (err: any) {
        toast.error('Lỗi khi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (importPreview.length === 0) {
      toast.error('Không tìm thấy dữ liệu hợp lệ trong file');
      return;
    }
    try {
      setIsProcessingImport(true);
      toast.loading('Đang import nhóm...', { id: 'import-group' });
      await teacherService.importGroupsBatch(selectedClassId, importPreview);
      toast.success('Import nhóm thành công', { id: 'import-group' });
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportPreview([]);
      loadClassData(selectedClassId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message, { id: 'import-group' });
    } finally {
      setIsProcessingImport(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    }
  });

  const filteredStudents = students.filter(s =>
    s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ungroupedStudents = filteredStudents.filter(s => !s.groupId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Quản lý Nhóm Sinh Viên
            <Users className="w-8 h-8 text-indigo-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Điều phối danh sách thành viên và phân công đề tài cho các nhóm.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsImportModalOpen(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={!selectedClassId}
          >
            <UploadCloud className="w-4 h-4 mr-2" /> Nhập từ Excel
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={!selectedClassId}
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo nhóm mới
          </Button>
        </div>
      </div>

      <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-1/3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Chọn Lớp học phần</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
            >
              {classes.length === 0 ? <option value="">Không có lớp phân công</option> : null}
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.classCode} - {c.subject?.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-2/3 flex items-end justify-end h-full mt-auto">
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl">
                Tổng sinh viên: <span className="font-black text-indigo-900">{students.length}</span>
              </div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl">
                Tổng số nhóm: <span className="font-black text-emerald-900">{groups.length}</span>
              </div>
              <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl">
                Chưa có nhóm: <span className="font-black text-amber-900">{students.filter(s => !s.groupId).length}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* DANH SÁCH NHÓM */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" /> Danh sách Nhóm
          </h3>

          {isLoading ? (
            <div className="text-center py-10 text-slate-400 font-medium">Đang tải dữ liệu...</div>
          ) : groups.length === 0 ? (
            <Card className="p-10 text-center rounded-2xl border-dashed border-2 bg-slate-50">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-slate-700 font-bold">Chưa có nhóm nào được tạo</h4>
              <p className="text-slate-500 text-sm mt-1">Tạo nhóm mới hoặc sử dụng tính năng chia nhóm tự động.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <Card key={group.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-shadow relative group/card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-black text-indigo-900 text-base">{group.name}</h4>
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                        {group.topicName || <span className="italic text-slate-400">Chưa có đề tài</span>}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover/card:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mt-4 min-h-[80px]">
                    {group.members?.length === 0 ? (
                      <p className="text-xs italic text-slate-400 text-center py-4">Nhóm chưa có thành viên</p>
                    ) : (
                      group.members?.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group/item">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{m.student.user.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{m.student.studentCode}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(group.id, m.studentId)}
                            className="text-rose-400 hover:text-rose-600 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            title="Xóa khỏi nhóm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* SINH VIÊN CHƯA CÓ NHÓM */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-3">
                Sinh viên tự do ({ungroupedStudents.length})
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sinh viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-h-[600px]">
              {ungroupedStudents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 italic font-medium">Tất cả sinh viên đã được xếp nhóm.</p>
              ) : (
                <div className="space-y-2">
                  {ungroupedStudents.map(student => (
                    <div key={student.id} className="p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors flex items-center justify-between group">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{student.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{student.studentCode}</p>
                      </div>

                      {/* Menu chọn nhóm để thêm vào */}
                      <select
                        className="text-[10px] p-1.5 rounded-lg border border-slate-200 bg-white max-w-[100px] outline-none opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddMember(e.target.value, student.id);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Thêm vào...</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Dialog Tạo Nhóm */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Tạo Nhóm Mới</DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Nhóm sẽ thuộc về lớp học phần đang được chọn. Bạn có thể thêm thành viên sau khi tạo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Tên nhóm / Mã nhóm <span className="text-rose-500">*</span></label>
              <Input
                placeholder="VD: Nhóm 1, Nhóm Alpha..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Tên đề tài (Tùy chọn)</label>
              <Input
                placeholder="VD: Xây dựng hệ thống ABC..."
                value={newGroupTopic}
                onChange={(e) => setNewGroupTopic(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2">
              <label className="text-xs font-bold text-slate-700 sticky top-0 bg-white z-10 pb-1 block">Chọn sinh viên (Tùy chọn)</label>
              {ungroupedStudents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Không có sinh viên tự do</p>
              ) : (
                ungroupedStudents.map(student => (
                  <label key={student.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds([...selectedStudentIds, student.id]);
                        } else {
                          setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                        }
                      }}
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-700">{student.fullName}</p>
                      <p className="text-[10px] text-slate-500">{student.studentCode}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateGroup}>Xác nhận tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Import Excel */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Nhập Nhóm Từ Excel</DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Vui lòng tải lên file có các cột: MSSV, Tên nhóm, Đề tài
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!importFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:bg-slate-50'}`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                <p className="text-sm font-bold text-slate-600">Kéo thả file vào đây, hoặc click để chọn file</p>
                <p className="text-xs text-slate-400 mt-1">Hỗ trợ .xlsx, .xls, .csv</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">{importFile.name}</p>
                      <p className="text-xs text-emerald-600">Tìm thấy {importPreview.length} nhóm hợp lệ</p>
                    </div>
                  </div>
                  <button onClick={() => { setImportFile(null); setImportPreview([]); }} className="p-1 hover:bg-emerald-100 rounded-full text-emerald-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {importPreview.length > 0 && (
                  <div className="max-h-[300px] overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 font-bold text-slate-600 border-b border-slate-200">Tên nhóm</th>
                          <th className="px-3 py-2 font-bold text-slate-600 border-b border-slate-200">Đề tài</th>
                          <th className="px-3 py-2 font-bold text-slate-600 border-b border-slate-200 text-center">Số SV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.map((g, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-semibold text-slate-700">{g.name}</td>
                            <td className="px-3 py-2 text-slate-500 truncate max-w-[200px]" title={g.topicName}>{g.topicName || '-'}</td>
                            <td className="px-3 py-2 text-center text-slate-600 font-bold">{g.studentCodes.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsImportModalOpen(false)}>Hủy</Button>
            <Button
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
              onClick={handleConfirmImport}
              disabled={!importFile || importPreview.length === 0 || isProcessingImport}
            >
              Xác nhận Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Layers = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 12 12 17 22 12" />
    <polyline points="2 17 12 22 22 17" />
  </svg>
);
