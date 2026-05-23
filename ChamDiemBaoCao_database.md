# CSDL – Phần Mềm Chấm Điểm Báo Cáo Đề Tài Môn Học
**Database:** MSSQL Server | **Collation:** Vietnamese_CI_AS

---

## 1. Khoa

```sql
CREATE TABLE Khoa (
    KhoaID      INT             IDENTITY(1,1)   PRIMARY KEY,
    MaKhoa      NVARCHAR(20)    NOT NULL        UNIQUE,
    TenKhoa     NVARCHAR(200)   NOT NULL,
    MoTa        NVARCHAR(500)   NULL,
    IsActive    BIT             NOT NULL        DEFAULT 1,
    NgayTao     DATETIME2       NOT NULL        DEFAULT GETDATE()
);
```

---

## 2. KyHoc

```sql
CREATE TABLE KyHoc (
    KyHocID     INT             IDENTITY(1,1)   PRIMARY KEY,
    MaKyHoc     NVARCHAR(20)    NOT NULL        UNIQUE,
    TenKyHoc    NVARCHAR(100)   NOT NULL,
    NamHoc      NVARCHAR(20)    NOT NULL,
    NgayBatDau  DATE            NOT NULL,
    NgayKetThuc DATE            NOT NULL,
    IsActive    BIT             NOT NULL        DEFAULT 1,
    IsLocked    BIT             NOT NULL        DEFAULT 0,
    NgayKhoa    DATETIME2       NULL,
    NgayTao     DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT CK_KyHoc_NgayHopLe CHECK (NgayKetThuc > NgayBatDau)
);
```

---

## 3. MonHoc

```sql
CREATE TABLE MonHoc (
    MonHocID    INT             IDENTITY(1,1)   PRIMARY KEY,
    MaMonHoc    NVARCHAR(20)    NOT NULL        UNIQUE,
    TenMonHoc   NVARCHAR(200)   NOT NULL,
    SoTinChi    TINYINT         NOT NULL        DEFAULT 3,
    KhoaID      INT             NOT NULL,
    MoTa        NVARCHAR(500)   NULL,
    IsActive    BIT             NOT NULL        DEFAULT 1,
    NgayTao     DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_MonHoc_Khoa FOREIGN KEY (KhoaID) REFERENCES Khoa(KhoaID)
);
```

---

## 4. LopHoc

```sql
CREATE TABLE LopHoc (
    LopHocID    INT             IDENTITY(1,1)   PRIMARY KEY,
    MaLop       NVARCHAR(20)    NOT NULL        UNIQUE,
    TenLop      NVARCHAR(100)   NOT NULL,
    KhoaID      INT             NOT NULL,
    NamNhapHoc  INT             NULL,
    IsActive    BIT             NOT NULL        DEFAULT 1,
    NgayTao     DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_LopHoc_Khoa FOREIGN KEY (KhoaID) REFERENCES Khoa(KhoaID)
);
```

---

## 5. VaiTro

```sql
CREATE TABLE VaiTro (
    VaiTroID    INT             IDENTITY(1,1)   PRIMARY KEY,
    MaVaiTro    NVARCHAR(30)    NOT NULL        UNIQUE,
    TenVaiTro   NVARCHAR(100)   NOT NULL,
    MoTa        NVARCHAR(300)   NULL
);
```

> Giá trị `MaVaiTro`: `SINH_VIEN`, `GIANG_VIEN`, `ADMIN`, `PHONG_DAO_TAO`

---

## 6. NguoiDung

```sql
CREATE TABLE NguoiDung (
    NguoiDungID     INT             IDENTITY(1,1)   PRIMARY KEY,
    TenDangNhap     NVARCHAR(50)    NOT NULL        UNIQUE,
    MatKhauHash     NVARCHAR(256)   NOT NULL,
    VaiTroID        INT             NOT NULL,
    HoTen           NVARCHAR(150)   NOT NULL,
    Email           NVARCHAR(150)   NULL,
    EmailCaNhan     NVARCHAR(150)   NULL,
    SoDienThoai     NVARCHAR(20)    NULL,
    NgaySinh        DATE            NULL,
    IsActive        BIT             NOT NULL        DEFAULT 1,
    IsLocked        BIT             NOT NULL        DEFAULT 0,
    SoLanSaiMatKhau TINYINT         NOT NULL        DEFAULT 0,
    LanDangNhapDau  BIT             NOT NULL        DEFAULT 1,
    NgayTao         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    NgayCapNhat     DATETIME2       NULL,
    NguoiTao        INT             NULL,
    CONSTRAINT FK_NguoiDung_VaiTro FOREIGN KEY (VaiTroID) REFERENCES VaiTro(VaiTroID)
);
```

---

## 7. SinhVien

```sql
CREATE TABLE SinhVien (
    SinhVienID      INT             IDENTITY(1,1)   PRIMARY KEY,
    NguoiDungID     INT             NOT NULL        UNIQUE,
    MSSV            NVARCHAR(20)    NOT NULL        UNIQUE,
    LopHocID        INT             NOT NULL,
    KhoaID          INT             NOT NULL,
    NamNhapHoc      INT             NULL,
    IsActive        BIT             NOT NULL        DEFAULT 1,
    CONSTRAINT FK_SinhVien_NguoiDung FOREIGN KEY (NguoiDungID) REFERENCES NguoiDung(NguoiDungID),
    CONSTRAINT FK_SinhVien_LopHoc   FOREIGN KEY (LopHocID)    REFERENCES LopHoc(LopHocID),
    CONSTRAINT FK_SinhVien_Khoa     FOREIGN KEY (KhoaID)      REFERENCES Khoa(KhoaID)
);
```

---

## 8. GiangVien

```sql
CREATE TABLE GiangVien (
    GiangVienID     INT             IDENTITY(1,1)   PRIMARY KEY,
    NguoiDungID     INT             NOT NULL        UNIQUE,
    MaGiangVien     NVARCHAR(20)    NOT NULL        UNIQUE,
    KhoaID          INT             NOT NULL,
    ChucDanh        NVARCHAR(100)   NULL,
    IsActive        BIT             NOT NULL        DEFAULT 1,
    CONSTRAINT FK_GiangVien_NguoiDung FOREIGN KEY (NguoiDungID) REFERENCES NguoiDung(NguoiDungID),
    CONSTRAINT FK_GiangVien_Khoa      FOREIGN KEY (KhoaID)      REFERENCES Khoa(KhoaID)
);
```

---

## 9. PhanCong

```sql
CREATE TABLE PhanCong (
    PhanCongID          INT             IDENTITY(1,1)   PRIMARY KEY,
    GiangVienID         INT             NOT NULL,
    MonHocID            INT             NOT NULL,
    LopHocID            INT             NOT NULL,
    KyHocID             INT             NOT NULL,
    HanNop              DATETIME2       NOT NULL,
    HanNopLai           DATETIME2       NULL,
    SoLanNopLaiToiDa    TINYINT         NOT NULL        DEFAULT 3,
    IsActive            BIT             NOT NULL        DEFAULT 1,
    NgayTao             DATETIME2       NOT NULL        DEFAULT GETDATE(),
    NguoiTao            INT             NULL,
    CONSTRAINT FK_PhanCong_GiangVien FOREIGN KEY (GiangVienID) REFERENCES GiangVien(GiangVienID),
    CONSTRAINT FK_PhanCong_MonHoc    FOREIGN KEY (MonHocID)    REFERENCES MonHoc(MonHocID),
    CONSTRAINT FK_PhanCong_LopHoc    FOREIGN KEY (LopHocID)    REFERENCES LopHoc(LopHocID),
    CONSTRAINT FK_PhanCong_KyHoc     FOREIGN KEY (KyHocID)     REFERENCES KyHoc(KyHocID),
    CONSTRAINT UQ_PhanCong UNIQUE (GiangVienID, MonHocID, LopHocID, KyHocID)
);
```

---

## 10. LichSuPhanCong

```sql
CREATE TABLE LichSuPhanCong (
    LichSuPhanCongID    INT             IDENTITY(1,1)   PRIMARY KEY,
    PhanCongID          INT             NOT NULL,
    GiangVienCuID       INT             NOT NULL,
    GiangVienMoiID      INT             NOT NULL,
    LyDo                NVARCHAR(500)   NOT NULL,
    NguoiThucHien       INT             NOT NULL,
    NgayThayDoi         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_LichSuPhanCong_PhanCong  FOREIGN KEY (PhanCongID)      REFERENCES PhanCong(PhanCongID),
    CONSTRAINT FK_LichSuPhanCong_GVCu      FOREIGN KEY (GiangVienCuID)   REFERENCES GiangVien(GiangVienID),
    CONSTRAINT FK_LichSuPhanCong_GVMoi     FOREIGN KEY (GiangVienMoiID)  REFERENCES GiangVien(GiangVienID),
    CONSTRAINT FK_LichSuPhanCong_NguoiTH   FOREIGN KEY (NguoiThucHien)   REFERENCES NguoiDung(NguoiDungID)
);
```

---

## 11. NhomSinhVien

```sql
CREATE TABLE NhomSinhVien (
    NhomID          INT             IDENTITY(1,1)   PRIMARY KEY,
    MaNhom          NVARCHAR(30)    NOT NULL,
    PhanCongID      INT             NOT NULL,
    NguoiDaiDienID  INT             NULL,
    NgayTao         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_Nhom_PhanCong   FOREIGN KEY (PhanCongID)      REFERENCES PhanCong(PhanCongID),
    CONSTRAINT FK_Nhom_DaiDien    FOREIGN KEY (NguoiDaiDienID)  REFERENCES SinhVien(SinhVienID),
    CONSTRAINT UQ_MaNhom_PhanCong UNIQUE (MaNhom, PhanCongID)
);
```

---

## 12. ThanhVienNhom

```sql
CREATE TABLE ThanhVienNhom (
    ThanhVienNhomID INT             IDENTITY(1,1)   PRIMARY KEY,
    NhomID          INT             NOT NULL,
    SinhVienID      INT             NOT NULL,
    NgayThamGia     DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_ThanhVienNhom_Nhom     FOREIGN KEY (NhomID)     REFERENCES NhomSinhVien(NhomID),
    CONSTRAINT FK_ThanhVienNhom_SinhVien FOREIGN KEY (SinhVienID) REFERENCES SinhVien(SinhVienID),
    CONSTRAINT UQ_ThanhVienNhom          UNIQUE (NhomID, SinhVienID)
);
```

---

## 13. DeTai

```sql
CREATE TABLE DeTai (
    DeTaiID         INT             IDENTITY(1,1)   PRIMARY KEY,
    TenDeTai        NVARCHAR(300)   NOT NULL,
    MoTa            NVARCHAR(1000)  NULL,
    PhanCongID      INT             NOT NULL,
    NhomID          INT             NULL,
    SinhVienID      INT             NULL,
    NgayTao         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_DeTai_PhanCong FOREIGN KEY (PhanCongID) REFERENCES PhanCong(PhanCongID),
    CONSTRAINT FK_DeTai_Nhom     FOREIGN KEY (NhomID)     REFERENCES NhomSinhVien(NhomID),
    CONSTRAINT FK_DeTai_SinhVien FOREIGN KEY (SinhVienID) REFERENCES SinhVien(SinhVienID),
    CONSTRAINT CK_DeTai_CaNhanHoacNhom CHECK (
        (NhomID IS NOT NULL AND SinhVienID IS NULL) OR
        (NhomID IS NULL     AND SinhVienID IS NOT NULL)
    )
);
```

---

## 14. TrangThaiBaoCao

```sql
CREATE TABLE TrangThaiBaoCao (
    MaTrangThai     NVARCHAR(20)    PRIMARY KEY,
    TenTrangThai    NVARCHAR(100)   NOT NULL,
    MoTa            NVARCHAR(300)   NULL,
    ThuTuHienThi    INT             NOT NULL
);
```

| MaTrangThai | TenTrangThai | Mô tả |
|---|---|---|
| `CHUA_NOP` | Chưa nộp | Trạng thái mặc định khi tạo đề tài |
| `DA_NOP` | Đã nộp | Sinh viên đã nộp file thành công |
| `DANG_CHAM` | Đang chấm | Giảng viên đang nhập điểm |
| `YEU_CAU_SUA` | Yêu cầu sửa | Giảng viên yêu cầu chỉnh sửa |
| `DA_CHAM` | Đã chấm | Giảng viên xác nhận hoàn tất |
| `CHO_DUYET` | Chờ duyệt | Chờ Phòng Đào tạo phê duyệt |
| `HOAN_THANH` | Hoàn thành | Đã phê duyệt, điểm công bố |
| `TU_CHOI` | Từ chối | Báo cáo vi phạm, cần nộp lại |

---

## 15. Rubric

```sql
CREATE TABLE Rubric (
    RubricID        INT             IDENTITY(1,1)   PRIMARY KEY,
    TenRubric       NVARCHAR(200)   NOT NULL,
    MoTa            NVARCHAR(500)   NULL,
    PhanCongID      INT             NOT NULL,
    ThangDiemToiDa  DECIMAL(5,2)    NOT NULL        DEFAULT 10.00,
    IsLocked        BIT             NOT NULL        DEFAULT 0,
    NgayTao         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    NgayCapNhat     DATETIME2       NULL,
    NguoiTao        INT             NOT NULL,
    RubricGocID     INT             NULL,
    CONSTRAINT FK_Rubric_PhanCong  FOREIGN KEY (PhanCongID)  REFERENCES PhanCong(PhanCongID),
    CONSTRAINT FK_Rubric_GiangVien FOREIGN KEY (NguoiTao)    REFERENCES GiangVien(GiangVienID),
    CONSTRAINT FK_Rubric_RubricGoc FOREIGN KEY (RubricGocID) REFERENCES Rubric(RubricID)
);
```

---

## 16. TieuChiRubric

```sql
CREATE TABLE TieuChiRubric (
    TieuChiID       INT             IDENTITY(1,1)   PRIMARY KEY,
    RubricID        INT             NOT NULL,
    TenTieuChi      NVARCHAR(200)   NOT NULL,
    MoTa            NVARCHAR(500)   NULL,
    ThangDiem       DECIMAL(5,2)    NOT NULL,
    TrongSo         DECIMAL(5,4)    NOT NULL,
    ThuTu           INT             NOT NULL        DEFAULT 1,
    CONSTRAINT FK_TieuChi_Rubric FOREIGN KEY (RubricID) REFERENCES Rubric(RubricID),
    CONSTRAINT CK_TrongSo CHECK (TrongSo > 0 AND TrongSo <= 1)
);
```

---

## 17. BaoCao

```sql
CREATE TABLE BaoCao (
    BaoCaoID        INT             IDENTITY(1,1)   PRIMARY KEY,
    DeTaiID         INT             NOT NULL        UNIQUE,
    RubricID        INT             NULL,
    MaTrangThai     NVARCHAR(20)    NOT NULL        DEFAULT 'CHUA_NOP',
    SoLanNopLai     TINYINT         NOT NULL        DEFAULT 0,
    NgayNopDau      DATETIME2       NULL,
    NgayNopCuoi     DATETIME2       NULL,
    IsLockedCuoiKy  BIT             NOT NULL        DEFAULT 0,
    NgayKhoa        DATETIME2       NULL,
    NguoiKhoa       INT             NULL,
    NgayTao         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_BaoCao_DeTai     FOREIGN KEY (DeTaiID)     REFERENCES DeTai(DeTaiID),
    CONSTRAINT FK_BaoCao_Rubric    FOREIGN KEY (RubricID)    REFERENCES Rubric(RubricID),
    CONSTRAINT FK_BaoCao_TrangThai FOREIGN KEY (MaTrangThai) REFERENCES TrangThaiBaoCao(MaTrangThai),
    CONSTRAINT FK_BaoCao_NguoiKhoa FOREIGN KEY (NguoiKhoa)  REFERENCES NguoiDung(NguoiDungID)
);
```

---

## 18. FileBaoCao

```sql
CREATE TABLE FileBaoCao (
    FileID          INT             IDENTITY(1,1)   PRIMARY KEY,
    BaoCaoID        INT             NOT NULL,
    LanNop          TINYINT         NOT NULL,
    LoaiFile        NVARCHAR(30)    NOT NULL,
    TenFile         NVARCHAR(300)   NOT NULL,
    DinhDangFile    NVARCHAR(10)    NOT NULL,
    DungLuongByte   BIGINT          NOT NULL,
    DuongDanLuuTru  NVARCHAR(500)   NOT NULL,
    HashFile        NVARCHAR(128)   NULL,
    NgayNop         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    NguoiNop        INT             NOT NULL,
    IsHienTai       BIT             NOT NULL        DEFAULT 1,
    CONSTRAINT FK_FileBaoCao_BaoCao   FOREIGN KEY (BaoCaoID)  REFERENCES BaoCao(BaoCaoID),
    CONSTRAINT FK_FileBaoCao_NguoiNop FOREIGN KEY (NguoiNop)  REFERENCES NguoiDung(NguoiDungID),
    CONSTRAINT CK_FileBaoCao_LoaiFile CHECK (LoaiFile IN ('BAO_CAO_CHINH', 'MINH_CHUNG', 'DINH_KEM'))
);
```

---

## 19. LichSuNop

```sql
CREATE TABLE LichSuNop (
    LichSuNopID     INT             IDENTITY(1,1)   PRIMARY KEY,
    BaoCaoID        INT             NOT NULL,
    LanNop          TINYINT         NOT NULL,
    NgayNop         DATETIME2       NOT NULL,
    SoFileDaKem     INT             NOT NULL        DEFAULT 0,
    GhiChu          NVARCHAR(300)   NULL,
    NguoiNop        INT             NOT NULL,
    CONSTRAINT FK_LichSuNop_BaoCao   FOREIGN KEY (BaoCaoID) REFERENCES BaoCao(BaoCaoID),
    CONSTRAINT FK_LichSuNop_NguoiNop FOREIGN KEY (NguoiNop) REFERENCES NguoiDung(NguoiDungID)
);
```

---

## 20. LichSuTrangThai

```sql
CREATE TABLE LichSuTrangThai (
    LichSuID        INT             IDENTITY(1,1)   PRIMARY KEY,
    BaoCaoID        INT             NOT NULL,
    TrangThaiCu     NVARCHAR(20)    NULL,
    TrangThaiMoi    NVARCHAR(20)    NOT NULL,
    LyDo            NVARCHAR(500)   NULL,
    NgayThayDoi     DATETIME2       NOT NULL        DEFAULT GETDATE(),
    NguoiThucHien   INT             NOT NULL,
    CONSTRAINT FK_LichSuTS_BaoCao  FOREIGN KEY (BaoCaoID)      REFERENCES BaoCao(BaoCaoID),
    CONSTRAINT FK_LichSuTS_TSCu    FOREIGN KEY (TrangThaiCu)   REFERENCES TrangThaiBaoCao(MaTrangThai),
    CONSTRAINT FK_LichSuTS_TSMoi   FOREIGN KEY (TrangThaiMoi)  REFERENCES TrangThaiBaoCao(MaTrangThai),
    CONSTRAINT FK_LichSuTS_NguoiTH FOREIGN KEY (NguoiThucHien) REFERENCES NguoiDung(NguoiDungID)
);
```

---

## 21. ChamDiem

```sql
CREATE TABLE ChamDiem (
    ChamDiemID      INT             IDENTITY(1,1)   PRIMARY KEY,
    BaoCaoID        INT             NOT NULL,
    GiangVienID     INT             NOT NULL,
    DiemTong        DECIMAL(5,2)    NULL,
    NhanXetTong     NVARCHAR(2000)  NULL,
    IsXacNhan       BIT             NOT NULL        DEFAULT 0,
    NgayBatDau      DATETIME2       NOT NULL        DEFAULT GETDATE(),
    NgayXacNhan     DATETIME2       NULL,
    CONSTRAINT FK_ChamDiem_BaoCao    FOREIGN KEY (BaoCaoID)    REFERENCES BaoCao(BaoCaoID),
    CONSTRAINT FK_ChamDiem_GiangVien FOREIGN KEY (GiangVienID) REFERENCES GiangVien(GiangVienID),
    CONSTRAINT UQ_ChamDiem           UNIQUE (BaoCaoID, GiangVienID)
);
```

---

## 22. DiemTheoTieuChi

```sql
CREATE TABLE DiemTheoTieuChi (
    DiemTieuChiID   INT             IDENTITY(1,1)   PRIMARY KEY,
    ChamDiemID      INT             NOT NULL,
    TieuChiID       INT             NOT NULL,
    DiemNhap        DECIMAL(5,2)    NOT NULL,
    NhanXet         NVARCHAR(1000)  NULL,
    NgayNhap        DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_DiemTC_ChamDiem FOREIGN KEY (ChamDiemID) REFERENCES ChamDiem(ChamDiemID),
    CONSTRAINT FK_DiemTC_TieuChi  FOREIGN KEY (TieuChiID)  REFERENCES TieuChiRubric(TieuChiID),
    CONSTRAINT UQ_DiemTC          UNIQUE (ChamDiemID, TieuChiID)
);
```

---

## 23. YeuCauSua

```sql
CREATE TABLE YeuCauSua (
    YeuCauSuaID     INT             IDENTITY(1,1)   PRIMARY KEY,
    BaoCaoID        INT             NOT NULL,
    GiangVienID     INT             NOT NULL,
    NoiDungYeuCau   NVARCHAR(2000)  NOT NULL,
    NgayGui         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    IsXuLy          BIT             NOT NULL        DEFAULT 0,
    NgayXuLy        DATETIME2       NULL,
    CONSTRAINT FK_YeuCauSua_BaoCao    FOREIGN KEY (BaoCaoID)    REFERENCES BaoCao(BaoCaoID),
    CONSTRAINT FK_YeuCauSua_GiangVien FOREIGN KEY (GiangVienID) REFERENCES GiangVien(GiangVienID)
);
```

---

## 24. PheDuyetKetQua

```sql
CREATE TABLE PheDuyetKetQua (
    PheDuyetID      INT             IDENTITY(1,1)   PRIMARY KEY,
    BaoCaoID        INT             NOT NULL,
    NguoiPheDuyet   INT             NOT NULL,
    HanhDong        NVARCHAR(20)    NOT NULL,
    LyDo            NVARCHAR(500)   NULL,
    NgayThucHien    DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_PheDuyet_BaoCao   FOREIGN KEY (BaoCaoID)      REFERENCES BaoCao(BaoCaoID),
    CONSTRAINT FK_PheDuyet_NguoiPD  FOREIGN KEY (NguoiPheDuyet) REFERENCES NguoiDung(NguoiDungID),
    CONSTRAINT CK_PheDuyet_HanhDong CHECK (HanhDong IN ('PHE_DUYET', 'TRA_VE'))
);
```

---

## 25. BinhLuan

```sql
CREATE TABLE BinhLuan (
    BinhLuanID      INT             IDENTITY(1,1)   PRIMARY KEY,
    BaoCaoID        INT             NOT NULL,
    NguoiGuiID      INT             NOT NULL,
    NoiDung         NVARCHAR(2000)  NOT NULL,
    NgayGui         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    IsAn            BIT             NOT NULL        DEFAULT 0,
    CONSTRAINT FK_BinhLuan_BaoCao   FOREIGN KEY (BaoCaoID)   REFERENCES BaoCao(BaoCaoID),
    CONSTRAINT FK_BinhLuan_NguoiGui FOREIGN KEY (NguoiGuiID) REFERENCES NguoiDung(NguoiDungID)
);
```

---

## 26. ThongBao

```sql
CREATE TABLE ThongBao (
    ThongBaoID      INT             IDENTITY(1,1)   PRIMARY KEY,
    NguoiNhanID     INT             NOT NULL,
    TieuDe          NVARCHAR(200)   NOT NULL,
    NoiDung         NVARCHAR(1000)  NOT NULL,
    LoaiThongBao    NVARCHAR(30)    NOT NULL,
    BaoCaoID        INT             NULL,
    IsDoc           BIT             NOT NULL        DEFAULT 0,
    IsGuiEmail      BIT             NOT NULL        DEFAULT 0,
    NgayTao         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    NgayDoc         DATETIME2       NULL,
    CONSTRAINT FK_ThongBao_NguoiNhan FOREIGN KEY (NguoiNhanID) REFERENCES NguoiDung(NguoiDungID),
    CONSTRAINT FK_ThongBao_BaoCao    FOREIGN KEY (BaoCaoID)    REFERENCES BaoCao(BaoCaoID),
    CONSTRAINT CK_ThongBao_Loai CHECK (LoaiThongBao IN ('TRANG_THAI', 'DEADLINE', 'YEU_CAU_SUA', 'HE_THONG'))
);
```

---

## 27. NhatKyHeThong

```sql
CREATE TABLE NhatKyHeThong (
    LogID           BIGINT          IDENTITY(1,1)   PRIMARY KEY,
    NguoiDungID     INT             NULL,
    TenDangNhap     NVARCHAR(50)    NULL,
    HanhDong        NVARCHAR(100)   NOT NULL,
    DoiTuong        NVARCHAR(50)    NULL,
    DoiTuongID      INT             NULL,
    MoTa            NVARCHAR(500)   NULL,
    DiaChiIP        NVARCHAR(45)    NULL,
    MucDo           NVARCHAR(20)    NOT NULL        DEFAULT 'INFO',
    NgayGio         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_Log_NguoiDung FOREIGN KEY (NguoiDungID) REFERENCES NguoiDung(NguoiDungID),
    CONSTRAINT CK_Log_MucDo    CHECK (MucDo IN ('INFO', 'WARN', 'ERROR', 'CRITICAL'))
);
```

---

## 28. CauHinhHeThong

```sql
CREATE TABLE CauHinhHeThong (
    CauHinhID       INT             IDENTITY(1,1)   PRIMARY KEY,
    NhomCauHinh     NVARCHAR(50)    NOT NULL,
    TenCauHinh      NVARCHAR(100)   NOT NULL,
    GiaTri          NVARCHAR(500)   NOT NULL,
    KieuDuLieu      NVARCHAR(20)    NOT NULL        DEFAULT 'STRING',
    MoTa            NVARCHAR(300)   NULL,
    NgayCapNhat     DATETIME2       NOT NULL        DEFAULT GETDATE(),
    NguoiCapNhat    INT             NULL,
    CONSTRAINT UQ_CauHinh              UNIQUE (NhomCauHinh, TenCauHinh),
    CONSTRAINT FK_CauHinh_NguoiCapNhat FOREIGN KEY (NguoiCapNhat) REFERENCES NguoiDung(NguoiDungID)
);
```

---

## 29. SaoLuuDuLieu

```sql
CREATE TABLE SaoLuuDuLieu (
    SaoLuuID        INT             IDENTITY(1,1)   PRIMARY KEY,
    TenSaoLuu       NVARCHAR(200)   NOT NULL,
    DuongDan        NVARCHAR(500)   NOT NULL,
    KichThuocByte   BIGINT          NULL,
    LoaiSaoLuu      NVARCHAR(20)    NOT NULL,
    TrangThai       NVARCHAR(20)    NOT NULL,
    GhiChu          NVARCHAR(500)   NULL,
    NgayThucHien    DATETIME2       NOT NULL        DEFAULT GETDATE(),
    NguoiThucHien   INT             NULL,
    CONSTRAINT FK_SaoLuu_NguoiTH    FOREIGN KEY (NguoiThucHien) REFERENCES NguoiDung(NguoiDungID),
    CONSTRAINT CK_SaoLuu_LoaiSaoLuu CHECK (LoaiSaoLuu IN ('TU_DONG', 'THU_CONG')),
    CONSTRAINT CK_SaoLuu_TrangThai  CHECK (TrangThai IN ('THANH_CONG', 'THAT_BAI', 'DANG_THUC_HIEN'))
);
```

---

## 30. PasswordResetToken

```sql
CREATE TABLE PasswordResetToken (
    TokenID         INT             IDENTITY(1,1)   PRIMARY KEY,
    NguoiDungID     INT             NOT NULL,
    Token           NVARCHAR(500)   NOT NULL        UNIQUE,
    HetHan          DATETIME2       NOT NULL,
    DaSuDung        BIT             NOT NULL        DEFAULT 0,
    NgayTao         DATETIME2       NOT NULL        DEFAULT GETDATE(),
    CONSTRAINT FK_PasswordResetToken_NguoiDung FOREIGN KEY (NguoiDungID) REFERENCES NguoiDung(NguoiDungID)
);
```

> Bảng này hỗ trợ luồng **quên mật khẩu qua email** (UC-01 luồng thay thế).
> - `Token`: chuỗi ngẫu nhiên được gửi vào email người dùng, độ dài 500 để an toàn với các thuật toán sinh token hiện đại.
> - `HetHan`: thời điểm hết hiệu lực của token (thường 15–30 phút sau khi tạo).
> - `DaSuDung`: đánh dấu token đã được dùng để đặt lại mật khẩu, ngăn dùng lại.
> - Mỗi lần người dùng yêu cầu đặt lại mật khẩu, backend nên vô hiệu hóa các token cũ chưa hết hạn của cùng `NguoiDungID` trước khi tạo token mới.

---

## Indexes

> Các index bổ sung cho các cột foreign key và cột thường xuyên xuất hiện trong điều kiện `WHERE`/`JOIN`. MSSQL tự tạo index cho `PRIMARY KEY` và `UNIQUE`, nhưng **không tự tạo** cho foreign key thông thường.

```sql
-- BaoCao
CREATE INDEX IX_BaoCao_MaTrangThai  ON BaoCao(MaTrangThai);
CREATE INDEX IX_BaoCao_DeTaiID      ON BaoCao(DeTaiID);
CREATE INDEX IX_BaoCao_RubricID     ON BaoCao(RubricID);

-- FileBaoCao
CREATE INDEX IX_FileBaoCao_BaoCaoID ON FileBaoCao(BaoCaoID);

-- LichSuNop
CREATE INDEX IX_LichSuNop_BaoCaoID  ON LichSuNop(BaoCaoID);

-- LichSuTrangThai
CREATE INDEX IX_LichSuTS_BaoCaoID   ON LichSuTrangThai(BaoCaoID);

-- ChamDiem
CREATE INDEX IX_ChamDiem_BaoCaoID    ON ChamDiem(BaoCaoID);
CREATE INDEX IX_ChamDiem_GiangVienID ON ChamDiem(GiangVienID);

-- DiemTheoTieuChi
CREATE INDEX IX_DiemTC_ChamDiemID   ON DiemTheoTieuChi(ChamDiemID);
CREATE INDEX IX_DiemTC_TieuChiID    ON DiemTheoTieuChi(TieuChiID);

-- YeuCauSua
CREATE INDEX IX_YeuCauSua_BaoCaoID  ON YeuCauSua(BaoCaoID);

-- BinhLuan
CREATE INDEX IX_BinhLuan_BaoCaoID   ON BinhLuan(BaoCaoID);

-- ThongBao
CREATE INDEX IX_ThongBao_NguoiNhanID ON ThongBao(NguoiNhanID);
CREATE INDEX IX_ThongBao_BaoCaoID    ON ThongBao(BaoCaoID);
CREATE INDEX IX_ThongBao_IsDoc       ON ThongBao(IsDoc);

-- DeTai
CREATE INDEX IX_DeTai_PhanCongID    ON DeTai(PhanCongID);
CREATE INDEX IX_DeTai_NhomID        ON DeTai(NhomID);
CREATE INDEX IX_DeTai_SinhVienID    ON DeTai(SinhVienID);

-- NhomSinhVien
CREATE INDEX IX_NhomSV_PhanCongID   ON NhomSinhVien(PhanCongID);

-- ThanhVienNhom
CREATE INDEX IX_ThanhVienNhom_NhomID     ON ThanhVienNhom(NhomID);
CREATE INDEX IX_ThanhVienNhom_SinhVienID ON ThanhVienNhom(SinhVienID);

-- PhanCong
CREATE INDEX IX_PhanCong_GiangVienID ON PhanCong(GiangVienID);
CREATE INDEX IX_PhanCong_MonHocID    ON PhanCong(MonHocID);
CREATE INDEX IX_PhanCong_LopHocID    ON PhanCong(LopHocID);
CREATE INDEX IX_PhanCong_KyHocID     ON PhanCong(KyHocID);

-- Rubric
CREATE INDEX IX_Rubric_PhanCongID   ON Rubric(PhanCongID);

-- TieuChiRubric
CREATE INDEX IX_TieuChi_RubricID    ON TieuChiRubric(RubricID);

-- NhatKyHeThong
CREATE INDEX IX_Log_NguoiDungID     ON NhatKyHeThong(NguoiDungID);
CREATE INDEX IX_Log_NgayGio         ON NhatKyHeThong(NgayGio);
CREATE INDEX IX_Log_MucDo           ON NhatKyHeThong(MucDo);

-- PasswordResetToken
CREATE INDEX IX_PRT_NguoiDungID     ON PasswordResetToken(NguoiDungID);
CREATE INDEX IX_PRT_HetHan          ON PasswordResetToken(HetHan);
```

---

## Thứ tự tạo bảng (theo phụ thuộc FK)

```
1.  Khoa
2.  KyHoc
3.  LopHoc
4.  MonHoc
5.  VaiTro
6.  NguoiDung
7.  SinhVien
8.  GiangVien
9.  PhanCong
10. LichSuPhanCong
11. NhomSinhVien
12. ThanhVienNhom
13. DeTai
14. TrangThaiBaoCao
15. Rubric
16. TieuChiRubric
17. BaoCao
18. FileBaoCao
19. LichSuNop
20. LichSuTrangThai
21. ChamDiem
22. DiemTheoTieuChi
23. YeuCauSua
24. PheDuyetKetQua
25. BinhLuan
26. ThongBao
27. NhatKyHeThong
28. CauHinhHeThong
29. SaoLuuDuLieu
30. PasswordResetToken
-- Sau khi tạo xong tất cả bảng, chạy script Indexes ở trên
```
