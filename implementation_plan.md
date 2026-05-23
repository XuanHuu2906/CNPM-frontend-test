# Phân quyền Giảng viên: Quản lý Nhóm & Đề tài (v2)

Chuyển đổi luồng nghiệp vụ từ Admin/PĐT nhập phân công chấm hàng loạt sang giảng viên phụ trách tự quản lý nhóm sinh viên và đề tài trong lớp học phần được giao.

---

## User Review Required

> [!IMPORTANT]
> **Schema migration phức tạp**: Hiện tại `Student.classId` (1 SV → 1 LHP) và `Student.groupId` (1 SV → 1 nhóm toàn hệ thống) đều sai kiến trúc. Cần chuyển sang bảng trung gian `ClassEnrollment` và kích hoạt `GroupMember` để hỗ trợ 1 SV → nhiều LHP → mỗi LHP có nhóm riêng.

> [!WARNING]
> **Breaking change DB**: Migration sẽ:
> - Tạo bảng mới `ClassEnrollment` (DangKyLopHocPhan)
> - Kích hoạt bảng `GroupMember` (ThanhVienNhom) — đã tồn tại trong schema nhưng chưa dùng
> - Xóa cột `Student.classId` và `Student.groupId`
> - Cập nhật toàn bộ query liên quan (submission, group, grade…)
>
> Đây là migration lớn nhất trong dự án. Dữ liệu seed hiện tại sẽ phải chạy lại.

> [!CAUTION]
> **Quy mô ảnh hưởng**: Schema migration tác động đến ~12 file backend (services, repositories, controllers, seed) và ~6 file frontend. Nên thực hiện từng phase và verify build sau mỗi phase.

---

## Open Questions

> [!IMPORTANT]
> **Q1**: `Student.classId` hiện là FK bắt buộc (NOT NULL). Sau migration, mỗi Student sẽ không còn `classId` trực tiếp mà thông qua `ClassEnrollment`. Có chấp nhận rằng **một Student có thể đăng ký nhiều LHP** trong cùng học kỳ không? (Giả định: **Có**, vì đây là thực tế giáo dục đại học.)

> [!IMPORTANT]  
> **Q2**: Khi xóa `Student.groupId`, submission flow hiện tại dùng `student.groupId` để xác định nộp bài cá nhân hay nhóm. Luồng mới sẽ cần truyền `classId` khi nộp bài để hệ thống tìm nhóm của SV trong LHP đó. Có đúng logic nghiệp vụ không?

---

## Phase A — Schema Migration

### [MODIFY] [schema.prisma](file:///d:/CNPM/CNPM-backend/prisma/schema.prisma)

**1. Tạo bảng `ClassEnrollment` (DangKyLopHocPhan)**:
```prisma
model ClassEnrollment {
  id        String   @id @default(cuid()) @map("DangKyID")
  studentId String   @map("SinhVienID")
  classId   String   @map("LopHocID")
  createdAt DateTime @default(now()) @map("NgayDangKy")

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  class   Class   @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@unique([studentId, classId])
  @@map("DangKyLopHocPhan")
}
```

**2. Cập nhật model `Student`**:
- Xóa `classId String @map("LopHocID")` và `groupId String? @map("NhomID")`
- Xóa relation `class Class` và `group Group?`
- Thêm `enrollments ClassEnrollment[]`

**3. Cập nhật model `Class`**:
- Xóa `students Student[]`
- Thêm `enrollments ClassEnrollment[]`

**4. Kích hoạt model `GroupMember`**:
- Di chuyển `GroupMember` từ "SUPPORTING MODELS" lên phần chính
- Thêm relation hai chiều với `Student` và `Group`:
  ```prisma
  model GroupMember {
    id        String   @id @default(cuid()) @map("ThanhVienNhomID")
    groupId   String   @map("NhomID")
    studentId String   @map("SinhVienID")
    joinedAt  DateTime @default(now()) @map("NgayThamGia")

    group   Group   @relation(fields: [groupId], references: [id], onDelete: Cascade)
    student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

    @@unique([groupId, studentId])
    @@map("ThanhVienNhom")
  }
  ```
- Cập nhật model `Group`: xóa `students Student[]`, thêm `members GroupMember[]`
- Cập nhật model `Student`: thêm `groupMemberships GroupMember[]`

**5. Cập nhật model `Submission`**:
- `Submission.studentId` vẫn giữ (submission cá nhân, dùng khi SV không có nhóm trong LHP đó)
- `Submission.groupId` vẫn giữ (submission nhóm)
- Nhưng logic xác định sẽ thay đổi (xem Phase B)

### [MODIFY] [seed.ts](file:///d:/CNPM/CNPM-backend/prisma/seed.ts)
- Thay `student.create({ classId })` → tạo Student trước, rồi tạo `ClassEnrollment`
- Thay `student.update({ groupId })` → tạo `GroupMember`

---

## Phase B — Backend Teacher API & Refactoring

### B1. Repository & Service Refactoring

#### [MODIFY] [group.repository.ts](file:///d:/CNPM/CNPM-backend/src/repositories/group.repository.ts)
- `createGroup`: Tạo Group + tạo `GroupMember` records (thay vì set `student.groupId`)
- `findGroupById`: Include `members → student → user` (thay vì `students → user`)
- `findGroupsByClassId`: Include `members → student → user`
- `updateMembers`: Xóa `GroupMember` cũ, tạo `GroupMember` mới (thay vì set `student.groupId`)
- `deleteGroup`: Xóa `GroupMember` records trước → xóa Group (hoặc dùng cascade)
- `findStudentsForValidation`: Query qua `ClassEnrollment` thay vì `student.classId`, kiểm tra `GroupMember` thay vì `student.groupId`

#### [MODIFY] [group.service.ts](file:///d:/CNPM/CNPM-backend/src/services/group.service.ts)
- `createGroup`: Validate SV thuộc LHP qua `ClassEnrollment`, kiểm tra chưa có `GroupMember` trong cùng LHP
- `updateMembers`: Kiểm tra qua `GroupMember` thay vì `student.groupId`

#### [MODIFY] [submission.service.ts](file:///d:/CNPM/CNPM-backend/src/services/submission.service.ts)
- `submitReport`: 
  - Yêu cầu `classId` bắt buộc
  - Kiểm tra SV đã enroll LHP qua `ClassEnrollment`
  - Tìm nhóm qua `GroupMember` + `Group.classId` thay vì `student.groupId`
  - **Rule mới**: Nếu SV có nhóm nhưng nhóm chưa có `topicName` → throw `"Nhóm chưa được giao đề tài. Không thể nộp bài!"`
- `getStudentSubmission`: Cần nhận `classId` để biết nhóm nào

#### [MODIFY] [submission.repository.ts](file:///d:/CNPM/CNPM-backend/src/repositories/submission.repository.ts)
- `findStudentSubmissionInClass`: Cập nhật query để tìm submission dựa trên `studentId` + nhóm trong LHP cụ thể (qua `GroupMember`)

#### [MODIFY] [grade.service.ts](file:///d:/CNPM/CNPM-backend/src/services/grade.service.ts)
- `submitGrade`: Tìm `classId` từ submission → kiểm tra `Assignment` ownership (teacher phụ trách LHP)

#### [MODIFY] [academic.service.ts](file:///d:/CNPM/CNPM-backend/src/services/academic.service.ts)
- Xóa hàm `createAssignmentsBatch` (dòng 272–407)
- Thêm `createEnrollmentsBatch`: Nhập danh sách SV đăng ký LHP hàng loạt
- `verifyTermActive`: Vẫn giữ nguyên

#### [MODIFY] [academic.repository.ts](file:///d:/CNPM/CNPM-backend/src/repositories/academic.repository.ts)
- Thêm `createEnrollment(studentId, classId)`
- Thêm `findEnrollment(studentId, classId)`
- Thêm `getStudentsByClassId(classId)` — trả về SV đã enroll LHP kèm thông tin nhóm

### B2. Teacher API (NEW)

#### [NEW] [teacher.service.ts](file:///d:/CNPM/CNPM-backend/src/services/teacher.service.ts)

Tất cả mutation đều chạy 2 bước kiểm tra trước:
1. **Ownership**: `prisma.assignment.findFirst({ where: { classId, teacherId } })` → nếu null → `ForbiddenError`
2. **Term lock**: `academicService.verifyTermActive(classId)`

Functions:
| Function | Mô tả |
|---|---|
| `getAssignedClassSections(teacherId)` | Trả về danh sách LHP được phân công, kèm Subject, Term, số SV |
| `getStudentsByClassId(classId, teacherId)` | SV đã enroll, kèm trạng thái nhóm trong LHP (qua `GroupMember`) |
| `getGroupsByClassId(classId, teacherId)` | Nhóm của LHP, kèm members, topic |
| `createGroup(classId, teacherId, data)` | Tạo nhóm + `GroupMember` — validate SV thuộc LHP, SV chưa có nhóm trong LHP |
| `updateGroupName(groupId, teacherId, name)` | Sửa tên nhóm |
| `deleteGroup(groupId, teacherId)` | **Chặn xóa nếu nhóm đã có Submission** — chỉ cho xóa khi 0 submission |
| `addMember(groupId, teacherId, studentId)` | Thêm SV — validate SV enroll LHP, chưa ở nhóm khác trong cùng LHP |
| `removeMember(groupId, teacherId, studentId)` | Gỡ SV khỏi nhóm |
| `updateGroupTopic(groupId, teacherId, topicName)` | Cập nhật tên đề tài |
| `autoGenerateGroups(classId, teacherId, targetSize)` | Chia SV chưa có nhóm thành nhóm "Nhóm 1", "Nhóm 2"… — **lưu thẳng**, kết quả trả về danh sách nhóm đã tạo |

#### [NEW] [teacher.controller.ts](file:///d:/CNPM/CNPM-backend/src/controllers/teacher.controller.ts)
Controller wrapper cho tất cả teacher.service functions.

#### [NEW] [teacher.routes.ts](file:///d:/CNPM/CNPM-backend/src/routes/v1/teacher.routes.ts)
Routes dành cho `UserRole.TEACHER`:
```
GET    /teacher/class-sections
GET    /teacher/class-sections/:id/students
GET    /teacher/class-sections/:id/groups
POST   /teacher/class-sections/:id/groups
POST   /teacher/class-sections/:id/groups/auto-generate
PATCH  /teacher/groups/:id
DELETE /teacher/groups/:id
POST   /teacher/groups/:id/members
DELETE /teacher/groups/:id/members/:studentId
PATCH  /teacher/groups/:id/topic
```

#### [MODIFY] [index.ts](file:///d:/CNPM/CNPM-backend/src/routes/index.ts)
- Import và đăng ký `router.use('/teacher', teacherRouter)`

### B3. Backend Cleanup

#### [MODIFY] [academic.controller.ts](file:///d:/CNPM/CNPM-backend/src/controllers/academic.controller.ts)
- Xóa handler `createAssignmentsBatch`
- Thêm handler `createEnrollmentsBatch`

#### [MODIFY] [academic.routes.ts](file:///d:/CNPM/CNPM-backend/src/routes/v1/academic.routes.ts)
- Xóa route `POST /assignments/batch`
- Thêm route `POST /enrollments/batch`

---

## Phase C — Frontend Changes

### C1. BatchImporter

#### [MODIFY] [BatchImporter.tsx](file:///d:/CNPM/CNPM-frontend/src/pages/admin/BatchImporter.tsx)
- Xóa `'PHAN_CONG_CHAM'` khỏi `ImportType` union
- **Thêm** `'DANG_KY_LOP'` — loại mới "Danh sách sinh viên trong lớp" (Enrollment)
  - Cột: `Mã lớp học phần`, `MSSV`
  - Validation: bắt buộc cả 2 cột, kiểm trùng lặp `[classCode, mssv]`
- Xóa block parsing/import cho `PHAN_CONG_CHAM`
- Thêm block parsing/import cho `DANG_KY_LOP`
- Cập nhật category list: thêm icon `Users` cho "Danh sách sinh viên trong lớp"
- Xóa import `ClipboardList` nếu không còn dùng

#### [MODIFY] [adminService.ts](file:///d:/CNPM/CNPM-frontend/src/services/adminService.ts)
- Xóa `createAssignmentsBatch`
- Thêm `createEnrollmentsBatch`

### C2. Academic Office Wording

#### [MODIFY] [AcademicLayout.tsx](file:///d:/CNPM/CNPM-frontend/src/layouts/AcademicLayout.tsx)
- Sidebar label `'Điều phối giảng dạy'` → `'Quản lý phân công LHP'`
- Mock notification: `'giảng viên chấm chính'` → `'giảng viên phụ trách'`

#### [MODIFY] [AcademicAssignment.tsx](file:///d:/CNPM/CNPM-frontend/src/pages/academic/AcademicAssignment.tsx)
- Tiêu đề: `'Điều phối Giảng viên Chấm Báo cáo'` → `'Quản lý phân công lớp học phần'`
- Tất cả `'giảng viên chấm chính'`, `'giảng viên chấm'` → `'giảng viên phụ trách'`
- Mô tả: `'Phân công chấm điểm & giám sát điểm số toàn học khoa'` → `'Quản lý giảng viên phụ trách các lớp học phần theo từng học kỳ'`

### C3. Teacher Group Management (NEW)

#### [NEW] [teacherService.ts](file:///d:/CNPM/CNPM-frontend/src/services/teacherService.ts)
API client cho Teacher endpoints mới:
```ts
getClassSections()
getStudents(classId)
getGroups(classId)
createGroup(classId, data)
updateGroupName(groupId, name)
deleteGroup(groupId)
addMember(groupId, studentId)
removeMember(groupId, studentId)
updateTopic(groupId, topicName)
autoGenerateGroups(classId, targetSize)
```

#### [NEW] [GroupManagement.tsx](file:///d:/CNPM/CNPM-frontend/src/pages/teacher/GroupManagement.tsx)
Trang quản lý nhóm & đề tài:
- **Header**: "Quản lý nhóm & Đề tài" + badge trạng thái học kỳ
- **Dropdown chọn LHP**: Từ API `/teacher/class-sections`
- **Cột trái**: SV chưa có nhóm (lấy từ API `/teacher/class-sections/:id/students` lọc SV chưa có GroupMember)
- **Cột phải**: Card nhóm hiện tại — tên nhóm, tên đề tài, thành viên, nút: sửa tên/đề tài, gỡ thành viên, xóa nhóm (disabled nếu có submission)
- **Thanh công cụ**: 
  - Nút "Tạo nhóm mới" (form modal: tên nhóm, tên đề tài, chọn SV)
  - Nút "Tự động chia nhóm" (nhập kích cỡ → **confirm modal**: "Hệ thống sẽ tự tạo X nhóm từ Y sinh viên chưa có nhóm. Bạn có chắc muốn tiếp tục?" → OK lưu thẳng)
- **Khóa giao diện**: Nếu học kỳ bị khóa → tất cả mutation disabled, banner cảnh báo

#### [MODIFY] [TeacherLayout.tsx](file:///d:/CNPM/CNPM-frontend/src/layouts/TeacherLayout.tsx)
- Thêm sidebar item ngay sau "Quản lý Lớp học phần":
  ```ts
  { title: 'Quản lý nhóm & đề tài', path: '/teacher/groups', icon: Users }
  ```

#### [MODIFY] [App.tsx](file:///d:/CNPM/CNPM-frontend/src/App.tsx)
- Import `GroupManagement`
- Thêm route: `<Route path="groups" element={<GroupManagement />} />`

### C4. Student Submission Guard

#### [MODIFY] Các trang nộp bài frontend (StudentSubmit.tsx, StudentDashboard.tsx)
- Nếu SV có nhóm nhưng nhóm chưa có `topicName` → hiển thị:
  - Badge: "Chưa được giao đề tài"  
  - Nút nộp bài bị disabled
  - Tooltip: "Liên hệ giảng viên phụ trách để được giao đề tài trước khi nộp bài."

---

## Use Case Documentation Updates

> [!NOTE]
> Các file tài liệu Use Case (`Use_Case_Modeling_Cham_Diem_Bao_Cao_2.md`, `FRONTEND_PROMPT.md`, `README.md`) cần cập nhật:
> - **UC-12**: Đổi thành "Nhập dữ liệu nền học kỳ" (bao gồm enrollment)
> - **UC-17**: Đổi thành "Quản lý giảng viên phụ trách lớp học phần"
> - **Thêm UC mới**: "Quản lý nhóm & đề tài" cho actor Giảng viên
> - **UC-09**: Ghi rõ giảng viên chấm báo cáo thuộc LHP mình phụ trách
> - **Bảng Actor–UC**: Thêm UC mới cho Giảng viên
>
> Sẽ cập nhật sau khi code hoàn tất để đảm bảo tài liệu khớp với implementation.

---

## Verification Plan

### Automated Tests (Build Check)
1. `npx tsc --noEmit` ở backend — build sạch
2. `npx tsc --noEmit` ở frontend — build sạch
3. `npx prisma generate` — schema hợp lệ
4. `npx prisma db push` hoặc migration — DB schema cập nhật

### Functional Test Cases

| # | Test Case | Expected |
|---|---|---|
| F1 | Mở BatchImporter → kiểm tra 5 loại dữ liệu | Còn: Sinh viên, Giảng viên, Học kỳ, Lớp học phần, **Danh sách SV trong lớp**. Không còn "Phân công chấm" |
| F2 | Import Enrollment (SV + LHP) | SV được liên kết với LHP qua `ClassEnrollment` |
| F3 | GV đăng nhập → sidebar có "Quản lý nhóm & đề tài" | Hiển thị đúng, click vào mở trang GroupManagement |
| F4 | Chọn LHP → hiển thị SV chưa có nhóm | Danh sách SV đã enroll LHP nhưng chưa có GroupMember |
| F5 | Tạo nhóm mới → thêm SV → sửa đề tài | Nhóm hiển thị với thành viên, đề tài cập nhật |
| F6 | Auto-generate nhóm (kích cỡ 3) | Confirm modal → OK → tạo nhóm tự động |

### Permission & Access Control Tests

| # | Test Case | Expected |
|---|---|---|
| P1 | GV A mở trang → chỉ thấy LHP được phân công | Không thấy LHP của GV B |
| P2 | GV A gọi API sửa nhóm thuộc LHP của GV B | HTTP 403 Forbidden |
| P3 | Thêm SV không thuộc LHP vào nhóm | HTTP 400 "Sinh viên không đăng ký lớp học phần này" |
| P4 | Thêm SV đã ở nhóm khác **trong cùng LHP** | HTTP 400 "Sinh viên đã thuộc nhóm khác trong lớp này" |
| P5 | SV cùng người nhưng ở LHP khác → có nhóm riêng ở LHP khác | Không bị chặn (đúng rule: scope theo LHP) |
| P6 | Học kỳ đã khóa → tạo/sửa/xóa nhóm | Tất cả HTTP 400 "Học kỳ đã đóng" |
| P7 | Xóa nhóm **đã có submission** | HTTP 400 "Không thể xóa nhóm đã có bài nộp" |
| P8 | SV nộp bài khi nhóm **chưa có đề tài** | HTTP 400 "Nhóm chưa được giao đề tài" |

### AcademicAssignment Wording Tests

| # | Check | Expected |
|---|---|---|
| W1 | Sidebar Academic Layout | "Quản lý phân công LHP" |
| W2 | Tiêu đề AcademicAssignment | "Quản lý phân công lớp học phần" |
| W3 | Tất cả text trong bảng | "giảng viên phụ trách", không còn "giảng viên chấm chính" |
