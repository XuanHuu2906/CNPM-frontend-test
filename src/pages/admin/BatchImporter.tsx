import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Check,
  Info,
  RefreshCw,
  HelpCircle,
  GraduationCap,
  UserCheck,
  BookOpen,
  Calendar,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { adminService } from '../../services/adminService';
import * as XLSX from 'xlsx';

// Definitions for the 5 import categories
type ImportType = 'SINH_VIEN' | 'GIANG_VIEN' | 'LOP_HOC_PHAN' | 'HOC_KY' | 'DANG_KY_LOP';

interface ValidationError {
  row: number;
  field: string;
  reason: string;
}

interface ParsedRecord {
  rowNumber: number;
  data: Record<string, any>;
  errors?: string[]; // aggregated error descriptions
  isValid: boolean;
}

export default function BatchImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportType>('SINH_VIEN');

  // Parsed records state
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [errorSummary, setErrorSummary] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);

  // Stepper helper
  const getStepStatus = (step: number) => {
    if (importCompleted) return 'completed';

    switch (step) {
      case 1:
        return 'completed'; // Category selection always selected
      case 2:
        return 'completed'; // Template is always accessible
      case 3:
        return file ? 'completed' : 'active';
      case 4:
        if (!file) return 'pending';
        return records.length > 0 ? 'completed' : 'active';
      case 5:
        if (records.length === 0) return 'pending';
        return 'active';
      default:
        return 'pending';
    }
  };

  // Safe helper to format date strings from Excel
  const parseDateValue = (val: any): string => {
    if (!val) return '';
    if (val instanceof Date) {
      const d = val.getDate().toString().padStart(2, '0');
      const m = (val.getMonth() + 1).toString().padStart(2, '0');
      const y = val.getFullYear();
      return `${d}/${m}/${y}`;
    }
    return String(val).trim();
  };

  // Main client-side parsing & validation
  const processUploadedFile = (selectedFile: File) => {
    setIsProcessing(true);
    setImportCompleted(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(ab, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet to raw arrays to maintain column mapping
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rows.length <= 1) {
          toast.error('Tệp tin trống hoặc không chứa dòng tiêu đề dữ liệu!');
          setIsProcessing(false);
          setFile(null);
          return;
        }

        const headers = rows[0].map(h => String(h || '').trim());
        const dataRows = rows.slice(1);

        const parsed: ParsedRecord[] = [];
        const errorsList: ValidationError[] = [];
        const summaryDict: Record<string, number> = {};

        const addError = (rowNum: number, field: string, reason: string, category: string) => {
          errorsList.push({ row: rowNum, field, reason });
          summaryDict[category] = (summaryDict[category] || 0) + 1;
        };

        // File-level uniqueness maps
        const uniqueKeys = new Set<string>();
        const uniqueEmails = new Set<string>();

        dataRows.forEach((row, idx) => {
          const rowNum = idx + 2; // Excel line count starts from 2 (header is 1)

          // Filter out completely empty lines
          if (row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
            return;
          }

          const recordData: Record<string, any> = {};
          const rowErrors: string[] = [];

          if (importType === 'SINH_VIEN') {
            // "MSSV", "Họ và tên", "Lớp", "Khoa", "Email trường", "Ngày sinh", "Trạng thái tài khoản"
            const mssv = String(row[0] || '').trim();
            const fullName = String(row[1] || '').trim();
            const className = String(row[2] || '').trim();
            const department = String(row[3] || '').trim();
            const email = String(row[4] || '').trim();
            const birthDate = parseDateValue(row[5]);
            const status = String(row[6] || 'Hoạt động').trim();

            recordData.mssv = mssv;
            recordData.fullName = fullName;
            recordData.className = className;
            recordData.department = department;
            recordData.email = email;
            recordData.birthDate = birthDate;
            recordData.status = status;

            // Validations
            if (!mssv) {
              addError(rowNum, 'MSSV', 'Mã số sinh viên không được để trống!', 'Thiếu mã số sinh viên');
              rowErrors.push('Thiếu MSSV');
            } else if (uniqueKeys.has(mssv)) {
              addError(rowNum, 'MSSV', `Trùng lặp mã sinh viên '${mssv}' trong tệp tin!`, 'Trùng mã sinh viên');
              rowErrors.push('Trùng mã sinh viên');
            } else {
              uniqueKeys.add(mssv);
            }

            if (!fullName) {
              addError(rowNum, 'Họ và tên', 'Họ tên sinh viên không được để trống!', 'Thiếu họ và tên');
              rowErrors.push('Thiếu họ tên');
            }

            if (!className) {
              addError(rowNum, 'Lớp', 'Lớp học phần không được để trống!', 'Thiếu lớp học phần');
              rowErrors.push('Thiếu lớp');
            }

            if (!email) {
              addError(rowNum, 'Email trường', 'Email học viện bắt buộc phải cung cấp!', 'Thiếu email');
              rowErrors.push('Thiếu email');
            } else if (!email.includes('@')) {
              addError(rowNum, 'Email trường', 'Email không đúng định dạng chuẩn (thiếu @)!', 'Sai định dạng email');
              rowErrors.push('Email sai định dạng');
            } else if (uniqueEmails.has(email)) {
              addError(rowNum, 'Email trường', `Trùng lặp email '${email}' trong tệp!`, 'Trùng lặp email');
              rowErrors.push('Trùng email');
            } else {
              uniqueEmails.add(email);
            }

            if (!birthDate) {
              addError(rowNum, 'Ngày sinh', 'Ngày sinh không được để trống!', 'Thiếu ngày sinh');
              rowErrors.push('Thiếu ngày sinh');
            }

          } else if (importType === 'GIANG_VIEN') {
            // "Mã giảng viên", "Họ và tên", "Email", "Khoa/Bộ môn", "Số điện thoại", "Trạng thái"
            const teacherCode = String(row[0] || '').trim();
            const fullName = String(row[1] || '').trim();
            const email = String(row[2] || '').trim();
            const department = String(row[3] || '').trim();
            const phone = String(row[4] || '').trim();
            const status = String(row[5] || 'Hoạt động').trim();

            recordData.teacherCode = teacherCode;
            recordData.fullName = fullName;
            recordData.email = email;
            recordData.department = department;
            recordData.phone = phone;
            recordData.status = status;

            // Validations
            if (!teacherCode) {
              addError(rowNum, 'Mã giảng viên', 'Mã giảng viên không được để trống!', 'Thiếu mã giảng viên');
              rowErrors.push('Thiếu mã giảng viên');
            } else if (uniqueKeys.has(teacherCode)) {
              addError(rowNum, 'Mã giảng viên', `Trùng mã giảng viên '${teacherCode}' trong tệp!`, 'Trùng mã giảng viên');
              rowErrors.push('Trùng mã giảng viên');
            } else {
              uniqueKeys.add(teacherCode);
            }

            if (!fullName) {
              addError(rowNum, 'Họ và tên', 'Họ tên giảng viên không được để trống!', 'Thiếu họ và tên');
              rowErrors.push('Thiếu họ tên');
            }

            if (!email) {
              addError(rowNum, 'Email', 'Email liên hệ bắt buộc!', 'Thiếu email');
              rowErrors.push('Thiếu email');
            } else if (!email.includes('@')) {
              addError(rowNum, 'Email', 'Email không đúng định dạng!', 'Sai định dạng email');
              rowErrors.push('Email sai định dạng');
            } else if (uniqueEmails.has(email)) {
              addError(rowNum, 'Email', `Trùng lặp email '${email}' trong tệp!`, 'Trùng lặp email');
              rowErrors.push('Trùng email');
            } else {
              uniqueEmails.add(email);
            }

          } else if (importType === 'LOP_HOC_PHAN') {
            // "Mã lớp học phần", "Tên môn", "Mã môn", "Học kỳ", "Năm học", "Mã giảng viên phụ trách", "Deadline nộp"
            const classCode = String(row[0] || '').trim();
            const subjectName = String(row[1] || '').trim();
            const subjectCode = String(row[2] || '').trim();
            const termName = String(row[3] || '').trim();
            const academicYear = String(row[4] || '').trim();
            const teacherCode = String(row[5] || '').trim();
            const deadline = parseDateValue(row[6]);

            recordData.classCode = classCode;
            recordData.subjectName = subjectName;
            recordData.subjectCode = subjectCode;
            recordData.termName = termName;
            recordData.academicYear = academicYear;
            recordData.teacherCode = teacherCode;
            recordData.deadline = deadline;

            // Validations
            if (!classCode) {
              addError(rowNum, 'Mã lớp học phần', 'Mã lớp học phần bắt buộc!', 'Thiếu mã lớp học phần');
              rowErrors.push('Thiếu mã lớp');
            } else if (uniqueKeys.has(classCode)) {
              addError(rowNum, 'Mã lớp học phần', `Trùng mã lớp '${classCode}' trong tệp!`, 'Trùng mã lớp học phần');
              rowErrors.push('Trùng mã lớp');
            } else {
              uniqueKeys.add(classCode);
            }

            if (!subjectCode || !subjectName) {
              addError(rowNum, 'Môn học', 'Mã môn và Tên môn không được để trống!', 'Thiếu thông tin môn học');
              rowErrors.push('Thiếu môn học');
            }

            if (!termName) {
              addError(rowNum, 'Học kỳ', 'Học kỳ bắt buộc!', 'Thiếu học kỳ');
              rowErrors.push('Thiếu học kỳ');
            }

            if (!teacherCode) {
              addError(rowNum, 'Mã giảng viên phụ trách', 'Mã giảng viên phụ trách bắt buộc và không được để trống!', 'Thiếu giảng viên phụ trách');
              rowErrors.push('Thiếu giảng viên');
            }

          } else if (importType === 'HOC_KY') {
            // "Mã học kỳ", "Tên học kỳ", "Ngày bắt đầu", "Ngày kết thúc", "Trạng thái"
            const termCode = String(row[0] || '').trim();
            const termName = String(row[1] || '').trim();
            const startDate = parseDateValue(row[2]);
            const endDate = parseDateValue(row[3]);
            const status = String(row[4] || 'Mở').trim();

            recordData.name = termCode;
            recordData.termNameText = termName;
            recordData.startDate = startDate;
            recordData.endDate = endDate;
            recordData.status = status;

            // Validations
            if (!termCode) {
              addError(rowNum, 'Mã học kỳ', 'Mã học kỳ không được để trống!', 'Thiếu mã học kỳ');
              rowErrors.push('Thiếu mã học kỳ');
            } else if (uniqueKeys.has(termCode)) {
              addError(rowNum, 'Mã học kỳ', `Trùng mã học kỳ '${termCode}' trong tệp!`, 'Trùng mã học kỳ');
              rowErrors.push('Trùng mã học kỳ');
            } else {
              uniqueKeys.add(termCode);
            }

            if (!termName) {
              addError(rowNum, 'Tên học kỳ', 'Tên học kỳ không được để trống!', 'Thiếu tên học kỳ');
              rowErrors.push('Thiếu tên học kỳ');
            }

            if (!startDate || !endDate) {
              addError(rowNum, 'Ngày tháng', 'Ngày bắt đầu và kết thúc bắt buộc phải điền!', 'Thiếu ngày tháng');
              rowErrors.push('Thiếu ngày tháng');
            } else {
              // Compare dates
              const startParts = startDate.split('/');
              const endParts = endDate.split('/');
              if (startParts.length === 3 && endParts.length === 3) {
                const sDate = new Date(+startParts[2], +startParts[1] - 1, +startParts[0]);
                const eDate = new Date(+endParts[2], +endParts[1] - 1, +endParts[0]);
                if (sDate >= eDate) {
                  addError(rowNum, 'Ngày kết thúc', 'Ngày kết thúc phải lớn hơn ngày bắt đầu học kỳ!', 'Sai logic ngày tháng');
                  rowErrors.push('Sai logic ngày');
                }
              }
            }

          } else if (importType === 'DANG_KY_LOP') {
            // "Mã lớp học phần", "MSSV"
            const classCode = String(row[0] || '').trim();
            const mssv = String(row[1] || '').trim();

            recordData.classCode = classCode;
            recordData.mssv = mssv;

            // Validations
            if (!classCode) {
              addError(rowNum, 'Mã lớp học phần', 'Mã lớp học phần không được để trống!', 'Thiếu lớp học phần');
              rowErrors.push('Thiếu lớp');
            }

            if (!mssv) {
              addError(rowNum, 'MSSV', 'MSSV không được để trống!', 'Thiếu MSSV');
              rowErrors.push('Thiếu MSSV');
            }

            if (classCode && mssv) {
              const pairKey = `${classCode}_${mssv}`;
              if (uniqueKeys.has(pairKey)) {
                addError(rowNum, 'Đăng ký trùng lặp', `Trùng lặp đăng ký của sinh viên ${mssv} vào lớp ${classCode} trong tệp tin!`, 'Đăng ký lớp trùng lặp');
                rowErrors.push('Trùng đăng ký lớp');
              } else {
                uniqueKeys.add(pairKey);
              }
            }
          }

          parsed.push({
            rowNumber: rowNum,
            data: recordData,
            errors: rowErrors.length > 0 ? rowErrors : undefined,
            isValid: rowErrors.length === 0
          });
        });

        setRecords(parsed);
        setValidationErrors(errorsList);
        setErrorSummary(summaryDict);
        setIsProcessing(false);

        if (errorsList.length > 0) {
          toast.warning(`Phát hiện ${errorsList.length} lỗi xác thực dữ liệu. Vui lòng xem bảng cảnh báo!`);
        } else {
          toast.success(`Xác thực hoàn tất! Tất cả ${parsed.length} dòng dữ liệu đều hợp lệ.`);
        }
      } catch (err: any) {
        toast.error(`Không thể phân tích tệp dữ liệu: ${err.message}`);
        setIsProcessing(false);
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const selectedFile = acceptedFiles[0];
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (extension !== 'xlsx' && extension !== 'xls' && extension !== 'csv') {
      toast.error('Định dạng tệp không hợp lệ! Vui lòng chọn tệp .xlsx, .xls hoặc .csv');
      return;
    }

    setFile(selectedFile);
    processUploadedFile(selectedFile);
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

  const handleClear = () => {
    setFile(null);
    setRecords([]);
    setValidationErrors([]);
    setErrorSummary({});
    setImportCompleted(false);
  };

  // Perform bulk actions via API calls
  const handleImportData = async (onlyImportValid: boolean) => {
    const rowsToImport = records.filter(r => !onlyImportValid || r.isValid);
    if (rowsToImport.length === 0) {
      toast.error('Không tìm thấy dòng hợp lệ nào để nhập!');
      return;
    }

    setIsProcessing(true);
    const loadingId = toast.loading('Đang gửi dữ liệu nhập hàng loạt lên máy chủ...');

    try {
      let result;
      const payload = rowsToImport.map(r => r.data);

      if (importType === 'SINH_VIEN') {
        const userPayload = payload.map(item => ({
          email: item.email,
          fullName: item.fullName,
          role: 'STUDENT',
          employeeCodeOrMssv: item.mssv,
          classId: item.className,
          password: '123456'
        }));
        result = await adminService.createUsersBatch(userPayload);
      } else if (importType === 'GIANG_VIEN') {
        const userPayload = payload.map(item => ({
          email: item.email,
          fullName: item.fullName,
          role: 'TEACHER',
          employeeCodeOrMssv: item.teacherCode,
          phoneNumber: item.phone || undefined,
          password: '123456'
        }));
        result = await adminService.createUsersBatch(userPayload);
      } else if (importType === 'LOP_HOC_PHAN') {
        result = await adminService.createClassesBatch(payload);
      } else if (importType === 'HOC_KY') {
        // Date formats are DD/MM/YYYY, convert to Date objects for the backend
        const termsPayload = payload.map(item => {
          const startParts = item.startDate.split('/');
          const endParts = item.endDate.split('/');
          return {
            name: item.name,
            startDate: new Date(+startParts[2], +startParts[1] - 1, +startParts[0]),
            endDate: new Date(+endParts[2], +endParts[1] - 1, +endParts[0])
          };
        });
        result = await adminService.createTermsBatch(termsPayload);
      } else if (importType === 'DANG_KY_LOP') {
        result = await adminService.createEnrollmentsBatch(payload);
      }

      // Count actual successful creations from the batch response
      let successCount = 0;
      let failCount = 0;
      const failDetails: string[] = [];

      if (Array.isArray(result)) {
        result.forEach(res => {
          if (res.success) successCount++;
          else {
            failCount++;
            failDetails.push(`${res.email || res.classCode || 'Dòng'}: ${res.error}`);
          }
        });
      } else {
        successCount = rowsToImport.length;
      }

      if (failCount > 0) {
        toast.warning(`Đã nhập thành công ${successCount} bản ghi. ${failCount} bản ghi thất bại ở máy chủ!`, { id: loadingId });
        console.error('Lỗi khi ghi nhận hàng loạt:', failDetails);
      } else {
        toast.success(`Đã thêm thành công ${successCount} dữ liệu mới vào cơ sở dữ liệu!`, { id: loadingId });
      }

      setImportCompleted(true);
      setIsProcessing(false);
      handleClear();
    } catch (error: any) {
      toast.error(`Import hàng loạt thất bại: ${error.message}`, { id: loadingId });
      setIsProcessing(false);
    }
  };

  // Generate and download a CSV report of parsing errors
  const downloadErrorLog = () => {
    if (validationErrors.length === 0) return;

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'Dòng,Trường lỗi,Lý do lỗi\n';

    validationErrors.forEach(err => {
      csvContent += `${err.row},"${err.field}","${err.reason}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `log_loi_nhap_lieu_${file?.name || 'importer'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải xuống tệp tin log lỗi định dạng!');
  };

  const getCategoryTitle = () => {
    switch (importType) {
      case 'SINH_VIEN': return 'Danh sách sinh viên';
      case 'GIANG_VIEN': return 'Giảng viên';
      case 'LOP_HOC_PHAN': return 'Lớp học phần';
      case 'HOC_KY': return 'Học kỳ';
      case 'DANG_KY_LOP': return 'Đăng ký lớp học phần';
    }
  };

  const getCategoryTemplateName = () => {
    switch (importType) {
      case 'SINH_VIEN': return 'sinh_vien';
      case 'GIANG_VIEN': return 'giang_vien';
      case 'LOP_HOC_PHAN': return 'lop_hoc_phan';
      case 'HOC_KY': return 'hoc_ky';
      case 'DANG_KY_LOP': return 'dang_ky_lop';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
          Nhập liệu hàng loạt
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: CONTROL & STEP PROGRESS */}
        <div className="lg:col-span-1 space-y-6">

          {/* STEPPER PROGRESS SIDEBAR */}
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Quy trình nhập dữ liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative pl-6 space-y-8 border-l border-slate-200 dark:border-slate-800">
                {[
                  { step: 1, label: 'Chọn loại dữ liệu', desc: 'Chọn phân khúc tài khoản hoặc thông tin cần đồng bộ' },
                  { step: 2, label: 'Tải file mẫu', desc: 'Sử dụng tệp CSV/Excel tiêu chuẩn được thiết lập sẵn' },
                  { step: 3, label: 'Tải file lên', desc: 'Kéo thả hoặc duyệt file dữ liệu từ máy tính của bạn' },
                  { step: 4, label: 'Kiểm tra dữ liệu', desc: 'Thẩm định định dạng, logic và các dòng trùng mã' },
                  { step: 5, label: 'Xác nhận nhập', desc: 'Xác minh lần cuối và đưa dữ liệu chính thức vào hệ thống' },
                ].map((s) => {
                  const status = getStepStatus(s.step);
                  return (
                    <div key={s.step} className="relative">
                      {/* Circle node indicator */}
                      <span className={`absolute -left-[35px] top-1 flex h-6 h-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ring-4 ring-white dark:ring-slate-900 ${status === 'completed'
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                        : status === 'active'
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        }`}>
                        {status === 'completed' ? <Check className="w-3.5 h-3.5" /> : s.step}
                      </span>
                      <div>
                        <h4 className={`text-sm font-bold transition-all duration-300 ${status === 'completed'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : status === 'active'
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-400 dark:text-slate-600'
                          }`}>
                          {s.label}
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-0.5">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* SELECT CATEGORY */}
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-2xl">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                1. Chọn phân loại dữ liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { value: 'SINH_VIEN', label: 'Danh sách sinh viên', icon: GraduationCap },
                  { value: 'GIANG_VIEN', label: 'Giảng viên', icon: UserCheck },
                  { value: 'LOP_HOC_PHAN', label: 'Lớp học phần', icon: BookOpen },
                  { value: 'HOC_KY', label: 'Học kỳ', icon: Calendar },
                  { value: 'DANG_KY_LOP', label: 'Đăng ký lớp học phần', icon: ClipboardList }
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setImportType(opt.value as any);
                        handleClear();
                      }}
                      className={`w-full p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-between active:scale-98 ${importType === opt.value
                        ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/10'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${importType === opt.value ? 'text-white' : 'text-slate-400'}`} />
                        {opt.label}
                      </div>
                      <Check className={`w-4 h-4 shrink-0 transition-opacity ${importType === opt.value ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* DOWNLOAD TEMPLATE */}
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-2xl">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                2. Tải tệp biểu mẫu mẫu (Template)
              </CardTitle>
              <CardDescription className="font-semibold text-slate-400 text-xs">
                Vui lòng điền đúng cấu trúc cột để tránh lỗi định dạng hệ thống.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 space-y-3">
              <a
                href={`/templates/${getCategoryTemplateName()}.xlsx`}
                download
                onClick={() => toast.success('Đang chuẩn bị tải xuống file biểu mẫu .xlsx...')}
                className="w-full h-11 border border-violet-200 dark:border-violet-900 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                Tải file mẫu Excel (.xlsx)
              </a>

              <a
                href={`/templates/${getCategoryTemplateName()}.csv`}
                download
                onClick={() => toast.success('Đang chuẩn bị tải xuống file biểu mẫu .csv...')}
                className="w-full h-11 border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                Tải file mẫu phẳng (.csv)
              </a>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: DRAG & DROP ZONE / DATA ANALYSIS PREVIEW */}
        <div className="lg:col-span-2 space-y-6">

          {/* DRAG & DROP ZONE */}
          {!file && (
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-md rounded-3xl overflow-hidden">
              <CardContent className="p-10">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${isDragActive
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 scale-[1.02]'
                    : 'border-slate-200 hover:border-violet-500/60 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-950/20'
                    }`}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4 shadow-sm animate-bounce">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Kéo và thả tệp dữ liệu vào đây</h3>
                  <p className="text-xs text-slate-400 mt-2 font-medium max-w-sm leading-relaxed">
                    Đẩy lên file thông tin của <span className="font-bold text-violet-600 dark:text-violet-400">"{getCategoryTitle()}"</span>.<br />
                    Hỗ trợ tệp định dạng .xlsx, .xls, .csv. Dung lượng tối đa 10MB.
                  </p>
                  <div className="mt-6">
                    <Button type="button" className="bg-violet-600 hover:bg-violet-700 font-bold rounded-xl px-5 py-5 text-xs text-white">
                      Chọn file từ thiết bị
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* LOADING STATE */}
          {file && isProcessing && (
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-md rounded-2xl">
              <CardContent className="p-16 flex flex-col items-center justify-center text-center">
                <RefreshCw className="w-10 h-10 text-violet-600 dark:text-violet-400 animate-spin mb-4" />
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">Đang đọc và thẩm định tệp tin...</h4>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">Hệ thống đang kiểm tra tính toàn vẹn và so khớp cấu trúc cột.</p>
              </CardContent>
            </Card>
          )}

          {/* DYNAMIC CHECK & ERROR VIEW */}
          {file && !isProcessing && records.length > 0 && (
            <div className="space-y-6">

              {/* FILE BASIC INFO CARD */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-5 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl text-violet-600 dark:text-violet-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {file.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      Kích thước: {(file.size / 1024).toFixed(1)} KB · Loại: {importType}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleClear}
                  variant="ghost"
                  size="sm"
                  className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 w-9 h-9 p-0"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </Button>
              </div>

              {/* STEP 3 & 4 METRICS AND STATISTICS CARD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số dòng</span>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{records.length}</h3>
                  </div>
                  <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                </div>
                <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Dòng hợp lệ</span>
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {records.filter(r => r.isValid).length}
                    </h3>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 dark:text-emerald-500/60" />
                </div>
                <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider">Dòng có lỗi</span>
                    <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{validationErrors.length}</h3>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-rose-400 dark:text-rose-500/60" />
                </div>
              </div>

              {/* AGGREGATED ERROR BUBBLES */}
              {validationErrors.length > 0 && (
                <Card className="border-rose-100 dark:border-rose-950/60 bg-rose-50/10 dark:bg-rose-950/5 rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="p-5 border-b border-rose-100 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10">
                    <CardTitle className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 shrink-0" /> Tổng hợp lỗi xác thực định dạng dữ liệu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap gap-2.5">
                      {Object.entries(errorSummary).map(([errName, count]) => (
                        <div
                          key={errName}
                          className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5"
                        >
                          <span className="w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-900 text-[10px] flex items-center justify-center font-black">
                            {count}
                          </span>
                          {errName}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* DETAILED ERRORS TABLE (STEP 4) */}
              {validationErrors.length > 0 && (
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      Chi tiết các dòng bị lỗi trong tệp tin
                    </h3>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40">
                          <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-20 text-center">Dòng Excel</th>
                          <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-40">Cột / Trường</th>
                          <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-rose-500 uppercase tracking-wider">Lý do lỗi chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {validationErrors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/10 dark:hover:bg-rose-950/5 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-slate-400 text-center">
                              {err.row}
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {err.field}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 font-semibold text-rose-600 dark:text-rose-400 leading-normal">
                              {err.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* CLEAN FILE SUCCESS DISPLAY */}
              {validationErrors.length === 0 && (
                <div className="p-8 bg-emerald-50/20 dark:bg-emerald-950/10 border border-dashed border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Bảng dữ liệu đã qua xác thực định dạng an toàn!</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                    Tất cả dòng trong tệp tin đều đầy đủ thông tin bắt buộc và đúng quy tắc logic. Nhấn "Xác nhận nhập" để ghi nhận trực tiếp vào Database.
                  </p>
                </div>
              )}

              {/* INTERACTIVE ACTION BAR (STEP 5) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-slate-300" /> Vui lòng kiểm tra kỹ lưỡng trước khi xác nhận lưu dữ liệu.
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="rounded-xl font-bold text-xs px-4 h-10 w-full sm:w-auto"
                  >
                    Hủy tệp dữ liệu
                  </Button>

                  {validationErrors.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={downloadErrorLog}
                      className="rounded-xl border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs px-4 h-10 w-full sm:w-auto flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải file báo lỗi
                    </Button>
                  )}

                  {validationErrors.length > 0 && records.filter(r => r.isValid).length > 0 && (
                    <Button
                      onClick={() => handleImportData(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 h-10 rounded-xl shadow-md shadow-amber-500/10 w-full sm:w-auto"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Nhập {records.filter(r => r.isValid).length} dòng hợp lệ
                    </Button>
                  )}

                  <Button
                    onClick={() => handleImportData(false)}
                    disabled={validationErrors.length > 0}
                    className={`font-bold text-xs px-5 h-10 rounded-xl shadow-sm transition-all w-full sm:w-auto ${validationErrors.length > 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                      : 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20'
                      }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Xác nhận nhập dữ liệu
                  </Button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
