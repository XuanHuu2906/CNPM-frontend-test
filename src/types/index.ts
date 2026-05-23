// ==========================================
// 1. VAI TRÒ & NGƯỜI DÙNG (USER & ROLES)
// ==========================================

export type Role = 'SINH_VIEN' | 'GIANG_VIEN' | 'PHONG_DAO_TAO' | 'ADMIN';

export interface User {
  id: string; // Map từ NguoiDungID (chuỗi để dễ scale)
  email: string;
  fullName: string;
  role: Role;
  identifier?: string; // MSSV hoặc MaGiangVien
  avatar?: string;
  isActive: boolean;
}

// Entity đại diện cho bảng NguoiDung trong DB
export interface NguoiDungEntity {
  NguoiDungID: number;
  TenDangNhap: string;
  MatKhauHash: string;
  VaiTroID: number;
  HoTen: string;
  Email?: string | null;
  EmailCaNhan?: string | null;
  SoDienThoai?: string | null;
  NgaySinh?: string | null;
  IsActive: boolean;
  IsLocked: boolean;
  SoLanSaiMatKhau: number;
  LanDangNhapDau: boolean;
  NgayTao: string;
  NgayCapNhat?: string | null;
  NguoiTao?: number | null;
}

// Entity đại diện cho bảng SinhVien trong DB
export interface SinhVienEntity {
  SinhVienID: number;
  NguoiDungID: number;
  MSSV: string;
  LopHocID: number;
  KhoaID: number;
  NamNhapHoc?: number | null;
  IsActive: boolean;
}

// Entity đại diện cho bảng GiangVien trong DB
export interface GiangVienEntity {
  GiangVienID: number;
  NguoiDungID: number;
  MaGiangVien: string;
  KhoaID: number;
  ChucDanh?: string | null;
  IsActive: boolean;
}


// ==========================================
// 2. KHOA, MÔN HỌC & LỚP HỌC (ACADEMIC CORE)
// ==========================================

export interface KhoaEntity {
  KhoaID: number;
  MaKhoa: string;
  TenKhoa: string;
  MoTa?: string | null;
  IsActive: boolean;
  NgayTao: string;
}

export interface KyHocEntity {
  KyHocID: number;
  MaKyHoc: string;
  TenKyHoc: string;
  NamHoc: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  IsActive: boolean;
  IsLocked: boolean;
  NgayKhoa?: string | null;
  NgayTao: string;
}

export interface MonHocEntity {
  MonHocID: number;
  MaMonHoc: string;
  TenMonHoc: string;
  SoTinChi: number;
  KhoaID: number;
  MoTa?: string | null;
  IsActive: boolean;
  NgayTao: string;
}

export interface LopHocEntity {
  LopHocID: number;
  MaLop: string;
  TenLop: string;
  KhoaID: number;
  NamNhapHoc?: number | null;
  IsActive: boolean;
  NgayTao: string;
}


// ==========================================
// 3. PHÂN CÔNG & ĐỀ TÀI (ASSIGNMENT & TOPIC)
// ==========================================

export interface PhanCongEntity {
  PhanCongID: number;
  GiangVienID: number;
  MonHocID: number;
  LopHocID: number;
  KyHocID: number;
  HanNop: string;
  HanNopLai?: string | null;
  SoLanNopLaiToiDa: number;
  IsActive: boolean;
  NgayTao: string;
  NguoiTao?: number | null;
}

export interface NhomSinhVienEntity {
  NhomID: number;
  MaNhom: string;
  PhanCongID: number;
  NguoiDaiDienID?: number | null;
  NgayTao: string;
}

export interface ThanhVienNhomEntity {
  ThanhVienNhomID: number;
  NhomID: number;
  SinhVienID: number;
  NgayThamGia: string;
}

export interface DeTaiEntity {
  DeTaiID: number;
  TenDeTai: string;
  MoTa?: string | null;
  PhanCongID: number;
  NhomID?: number | null;
  SinhVienID?: number | null;
  NgayTao: string;
}


// ==========================================
// 4. BÁO CÁO & FILE (SUBMISSIONS & FILE)
// ==========================================

export type SubmissionStatus = 
  | 'CHUA_NOP'
  | 'DA_NOP'
  | 'DANG_CHAM'
  | 'YEU_CAU_SUA'
  | 'DA_CHAM'
  | 'CHO_DUYET'
  | 'HOAN_THANH'
  | 'TU_CHOI';

// Interface nghiệp vụ dùng ở Frontend (đã tinh gọn từ Join nhiều bảng)
export interface Submission {
  id: string; // Map từ BaoCaoID
  topicName: string; // Map từ DeTai.TenDeTai
  groupId: string; // Map từ NhomSinhVien.MaNhom hoặc SinhVien.MSSV
  studentId: string;
  teacherId: string;
  status: SubmissionStatus;
  fileUrl?: string;
  fileName?: string;
  version: number; // Map từ SoLanNopLai
  editNote?: string; // Map từ NoiDungYeuCau của YeuCauSua mới nhất
  submittedAt?: string; // Map từ NgayNopCuoi
  deadlineAt: string; // Map từ PhanCong.HanNop
}

// Entity đại diện cho bảng BaoCao trong DB
export interface BaoCaoEntity {
  BaoCaoID: number;
  DeTaiID: number;
  RubricID?: number | null;
  MaTrangThai: SubmissionStatus;
  SoLanNopLai: number;
  NgayNopDau?: string | null;
  NgayNopCuoi?: string | null;
  IsLockedCuoiKy: boolean;
  NgayKhoa?: string | null;
  NguoiKhoa?: number | null;
  NgayTao: string;
}

// Entity đại diện cho bảng FileBaoCao trong DB
export interface FileBaoCaoEntity {
  FileID: number;
  BaoCaoID: number;
  LanNop: number;
  LoaiFile: 'BAO_CAO_CHINH' | 'MINH_CHUNG' | 'DINH_KEM';
  TenFile: string;
  DinhDangFile: string;
  DungLuongByte: number;
  DuongDanLuuTru: string;
  HashFile?: string | null;
  NgayNop: string;
  NguoiNop: number;
  IsHienTai: boolean;
}


// ==========================================
// 5. RUBRIC & CHẤM ĐIỂM (RUBRICS & EVALUATION)
// ==========================================

// Entity đại diện cho bảng Rubric trong DB
export interface RubricEntity {
  RubricID: number;
  TenRubric: string;
  MoTa?: string | null;
  PhanCongID: number;
  ThangDiemToiDa: number;
  IsLocked: boolean;
  NgayTao: string;
  NgayCapNhat?: string | null;
  NguoiTao: number;
  RubricGocID?: number | null;
}

// Entity đại diện cho bảng TieuChiRubric trong DB
export interface TieuChiRubricEntity {
  TieuChiID: number;
  RubricID: number;
  TenTieuChi: string;
  MoTa?: string | null;
  ThangDiem: number;
  TrongSo: number;
  ThuTu: number;
}

// Entity đại diện cho bảng ChamDiem trong DB
export interface ChamDiemEntity {
  ChamDiemID: number;
  BaoCaoID: number;
  GiangVienID: number;
  DiemTong?: number | null;
  NhanXetTong?: string | null;
  IsXacNhan: boolean;
  NgayBatDau: string;
  NgayXacNhan?: string | null;
}

// Entity đại diện cho bảng DiemTheoTieuChi trong DB
export interface DiemTheoTieuChiEntity {
  DiemTieuChiID: number;
  ChamDiemID: number;
  TieuChiID: number;
  DiemNhap: number;
  NhanXet?: string | null;
  NgayNhap: string;
}


// ==========================================
// 6. YÊU CẦU SỬA, THẢO LUẬN & THÔNG BÁO (COLLABORATION)
// ==========================================

export interface YeuCauSuaEntity {
  YeuCauSuaID: number;
  BaoCaoID: number;
  GiangVienID: number;
  NoiDungYeuCau: string;
  NgayGui: string;
  IsXuLy: boolean;
  NgayXuLy?: string | null;
}

export interface BinhLuanEntity {
  BinhLuanID: number;
  BaoCaoID: number;
  NguoiGuiID: number;
  NoiDung: string;
  NgayGui: string;
  IsAn: boolean;
}

export interface ThongBaoEntity {
  ThongBaoID: number;
  NguoiNhanID: number;
  TieuDe: string;
  NoiDung: string;
  LoaiThongBao: 'TRANG_THAI' | 'DEADLINE' | 'YEU_CAU_SUA' | 'HE_THONG';
  BaoCaoID?: number | null;
  IsDoc: boolean;
  IsGuiEmail: boolean;
  NgayTao: string;
  NgayDoc?: string | null;
}


// ==========================================
// 7. FRONTEND API RESPONSE TYPES
// ==========================================

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  personalEmail?: string;
  avatar?: string;
  role: Role;
  student?: {
    id: string;
    studentCode: string;
    groupId?: string;
    classId?: string;
    class?: {
      classCode: string;
      term?: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        isLocked: boolean;
      };
      assignments?: Array<{
        teacher?: {
          user?: {
            fullName: string;
          };
        };
      }>;
    };
  };
}

export interface GroupDetail {
  id: string;
  name: string;
  topicName?: string;
  members?: Array<{
    student: {
      id: string;
      studentCode: string;
      user?: {
        fullName: string;
      };
    };
  }>;
}

export interface StatusLog {
  id: string;
  newStatus: SubmissionStatus;
  oldStatus?: SubmissionStatus;
  note?: string;
  createdAt: string;
  userId?: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: {
    fullName: string;
  };
  createdAt: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description?: string;
  weight: number;
  maxScore: number;
}

export interface Rubric {
  id: string;
  name: string;
  criteria: RubricCriterion[];
}

export interface Grade {
  id: string;
  finalScore: number;
  detailedScores?: string;
  feedback?: string;
  rubric?: Rubric;
  createdAt: string;
}

export interface SubmissionDetail {
  id: string;
  status: SubmissionStatus;
  filePath?: string;
  attachments?: string[];
  statusLogs?: StatusLog[];
  comments?: Comment[];
  grades?: Grade[];
  editRequestNote?: string;
  rejectReason?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}
