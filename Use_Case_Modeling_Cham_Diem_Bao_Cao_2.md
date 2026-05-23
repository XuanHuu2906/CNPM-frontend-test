# TÀI LIỆU USE CASE MODELING
## PHẦN MỀM CHẤM ĐIỂM BÁO CÁO ĐỀ TÀI MÔN HỌC

| **Thông tin** | **Nội dung** |
| --- | --- |
| Tên tài liệu | Use Case Modeling |
| Dự án | Phần mềm Chấm Điểm Báo Cáo Đề Tài Môn Học |
| Phiên bản | 1.0 |
| Ngày lập | 27/04/2026 |
| Cách trình bày | Đơn giản, rõ ràng, không sử dụng màu sắc trang trí |

## Mục đích tài liệu

Tài liệu này mô tả các tác nhân, danh sách Use Case và đặc tả chi tiết các Use Case chính của hệ thống. Nội dung được tổng hợp từ tài liệu đối tượng sử dụng, tài liệu xác định yêu cầu và hướng dẫn lập Use Case Modeling.

---

## 1. Tổng quan hệ thống

Phần mềm Chấm Điểm Báo Cáo Đề Tài Môn Học hỗ trợ quản lý quy trình nộp, theo dõi, chấm điểm, phê duyệt và công bố kết quả báo cáo đề tài của sinh viên. Hệ thống phân quyền theo vai trò để đảm bảo sinh viên, giảng viên, Admin và Phòng Đào tạo thực hiện đúng trách nhiệm.

Phạm vi chính của hệ thống gồm:

- **Sinh viên** nộp báo cáo, nộp lại khi được yêu cầu, theo dõi trạng thái và xem kết quả.
- **Giảng viên** thiết lập phiếu chấm điểm, xem báo cáo, chấm điểm, nhận xét và yêu cầu sửa.
- **Admin** quản trị tài khoản, nhập dữ liệu phân công, cấu hình, sao lưu và hỗ trợ kỹ thuật.
- **Phòng Đào tạo** phê duyệt điểm cuối cùng, giám sát tiến độ và điều chỉnh phân công khi cần.

---

## 2. Tác nhân (Actors)

| **Tên Actor** | **Mô tả** |
| --- | --- |
| Sinh viên | Người nộp báo cáo đề tài, tài liệu minh chứng, file đính kèm; theo dõi tiến độ, xem điểm và phản hồi sau khi được công bố. |
| Giảng viên | Người thiết lập phiếu chấm điểm, xem báo cáo, chấm điểm, nhập nhận xét, yêu cầu sửa và xuất báo cáo lớp/môn học phụ trách. |
| Quản trị hệ thống (Admin) | Người vận hành hệ thống, nhập dữ liệu phân công, cấp/phân quyền tài khoản, cấu hình hệ thống, khóa kết quả và hỗ trợ kỹ thuật. |
| Phòng Đào tạo | Đơn vị phê duyệt kết quả cuối cùng, điều chỉnh phân công giảng viên, giám sát tiến độ và xem báo cáo thống kê toàn khoa. |
| Hệ thống quản lý sinh viên | Hệ thống ngoài cung cấp hoặc đồng bộ dữ liệu sinh viên, lớp học, môn học, phân công khi có tích hợp. |
| Dịch vụ Email/Thông báo | Hệ thống ngoài hoặc module phụ trách gửi email và thông báo nội bộ khi có deadline, yêu cầu sửa hoặc thay đổi trạng thái. |

---

## 3. Danh sách Use Case

> **Ký hiệu:** UC là Use Case chính; UC-I là Use Case phụ dạng `<<include>>`, thường được gọi bởi các Use Case chính.

| **Mã UC** | **Tên Use Case** | **Actor chính** | **Loại** | **Mô tả ngắn** |
| --- | --- | --- | --- | --- |
| UC-01 | Đăng nhập hệ thống | Tất cả người dùng | Chính | Xác thực tài khoản và chuyển đến giao diện theo vai trò. |
| UC-02 | Quản lý thông tin cá nhân | Sinh viên | Chính | Xem/cập nhật thông tin liên hệ, đổi mật khẩu, xem thông tin nhóm. |
| UC-03 | Nộp báo cáo | Sinh viên | Chính | Upload báo cáo chính và file đính kèm. |
| UC-04 | Nộp lại báo cáo | Sinh viên | Chính | Nộp phiên bản chỉnh sửa khi trạng thái cho phép. |
| UC-05 | Theo dõi tiến độ | Sinh viên | Chính | Xem trạng thái báo cáo, lịch sử nộp và lịch sử chuyển trạng thái. |
| UC-06 | Xem điểm và phản hồi | Sinh viên | Chính | Sinh viên xem điểm và nhận xét của giảng viên khi báo cáo đạt trạng thái HOAN_THANH. Sinh viên xem nội dung cần chỉnh sửa khi báo cáo đạt trạng thái YEU_CAU_SUA. |
| UC-07 | Quản lý danh sách sinh viên | Giảng viên | Chính | Xem danh sách sinh viên/nhóm được phân công, có thể lọc theo trạng thái báo cáo để theo dõi tiến độ nộp và chấm bài. |
| UC-08 | Thiết lập phiếu chấm điểm | Giảng viên | Chính | Tạo/chỉnh sửa tiêu chí, thang điểm, trọng số trước khi chấm. |
| UC-09 | Chấm điểm báo cáo | Giảng viên | Chính | Xem file, nhập điểm theo phiếu chấm điểm, nhận xét và xác nhận chấm xong. |
| UC-10 | Gửi yêu cầu sửa | Giảng viên | Chính | Yêu cầu sinh viên chỉnh sửa báo cáo kèm ghi chú cụ thể. |
| UC-11 | Xuất báo cáo lớp | Giảng viên | Chính | Xuất bảng điểm/thống kê lớp hoặc môn học phụ trách. |
| UC-12 | Nhập danh sách phân công | Admin | Chính | Nhập Excel/CSV phân công môn học, giảng viên, lớp học. |
| UC-13 | Cấp phân quyền tài khoản | Admin | Chính | Tạo, khóa/mở, đặt lại mật khẩu, gán vai trò tài khoản. |
| UC-14 | Cấu hình hệ thống | Admin | Chính | Cấu hình thang điểm, định dạng file, dung lượng, thông báo, kiểm tra đạo văn. |
| UC-15 | Xử lý vi phạm | Admin, Giảng viên | Chính | Chuyển báo cáo sang trạng thái Từ chối khi vi phạm quy định. |
| UC-16 | Phê duyệt kết quả | Phòng Đào tạo | Chính | Duyệt kết quả cuối cùng hoặc trả về chấm lại. |
| UC-17 | Điều chỉnh phân công | Phòng Đào tạo | Chính | Điều chỉnh giảng viên phụ trách khi cần và ghi nhận lịch sử. |
| UC-18 | Giám sát tiến độ | Phòng Đào tạo, Admin | Chính | Theo dõi tiến độ toàn khoa/toàn hệ thống theo lớp, môn, giảng viên, kỳ học. |
| UC-19 | Khóa kết quả cuối kỳ | Admin | Chính | Khóa điểm sau khi Phòng Đào tạo phê duyệt toàn bộ. |
| UC-20 | Sao lưu phục hồi dữ liệu | Admin | Chính | Sao lưu định kỳ/thủ công và phục hồi khi có sự cố. |
| UC-21 | Xem nhật ký hệ thống | Admin | Chính | Xem lịch sử đăng nhập, thao tác quan trọng và hoạt động bất thường. |
| UC-22 | Trao đổi qua bình luận | Giảng viên, Sinh viên | Chính | Giảng viên và sinh viên trao đổi, hỏi đáp qua bình luận gắn với báo cáo. |
| UC-23 | Gửi yêu cầu nộp lại báo cáo | Sinh viên, Giảng viên | Chính | Sinh viên gửi yêu cầu xin nộp lại khi phát hiện sai file sau khi đã nộp; giảng viên phê duyệt hoặc từ chối. |
| UC-I01 | Kiểm tra quyền truy cập | Hệ thống | `<<include>>` | Được gọi trước các thao tác cần phân quyền. |
| UC-I02 | Kiểm tra file nộp | Hệ thống | `<<include>>` | Kiểm tra định dạng, dung lượng và hạn nộp. |
| UC-I03 | Gửi thông báo tự động | Dịch vụ Email/Thông báo | `<<include>>` | Gửi thông báo khi deadline, yêu cầu sửa hoặc trạng thái thay đổi. |
| UC-I04 | Ghi lịch sử trạng thái | Hệ thống | `<<include>>` | Ghi thời điểm, người thực hiện và trạng thái mới. |
| UC-I05 | Tính điểm tổng | Hệ thống | `<<include>>` | Tự tính điểm tổng theo phiếu chấm điểm/trọng số và quy đổi khi cần. |
| UC-I06 | Đồng bộ dữ liệu | Hệ thống quản lý sinh viên | `<<include>>` | Đồng bộ danh sách sinh viên, lớp, môn học hoặc phân công. |

---

## 4. Quan hệ Actor - Use Case

| **Actor** | **Use Case liên quan** |
| --- | --- |
| Sinh viên | UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-22, UC-23 |
| Giảng viên | UC-01, UC-07, UC-08, UC-09, UC-10, UC-11, UC-15, UC-22, UC-23 |
| Admin | UC-01, UC-12, UC-13, UC-14, UC-15, UC-18, UC-19, UC-20, UC-21 |
| Phòng Đào tạo | UC-01, UC-16, UC-17, UC-18 |
| Hệ thống quản lý sinh viên | UC-I06 |
| Dịch vụ Email/Thông báo | UC-I03 |

---

## 5. Trạng thái báo cáo liên quan

Các trạng thái dưới đây được dùng trong các Use Case nộp bài, chấm điểm, yêu cầu sửa, phê duyệt và khóa kết quả.

| **Mã trạng thái** | **Tên trạng thái** | **Ý nghĩa** |
| --- | --- | --- |
| CHUA_NOP | Chưa nộp | Trạng thái mặc định khi sinh viên chưa gửi file. |
| DA_NOP | Đã nộp | Sinh viên đã nộp báo cáo hợp lệ. |
| DANG_CHAM | Đang chấm | Giảng viên đang xem và nhập điểm. |
| YEU_CAU_SUA | Yêu cầu sửa | Giảng viên yêu cầu sinh viên chỉnh sửa. |
| DA_CHAM | Đã chấm | Giảng viên đã xác nhận chấm xong. |
| CHO_DUYET | Chờ duyệt | Kết quả chờ Phòng Đào tạo phê duyệt. |
| HOAN_THANH | Hoàn thành | Kết quả đã được phê duyệt và công bố. |
| TU_CHOI | Từ chối | Báo cáo vi phạm hoặc không đạt yêu cầu nộp. |

---

## 6. Đặc tả chi tiết Use Case

Mỗi Use Case được mô tả theo các mục: tên, mô tả, tác nhân, tiền điều kiện, hậu điều kiện, kích hoạt, luồng chính, luồng thay thế, ngoại lệ và UC liên quan.

---

### UC-01: Đăng nhập hệ thống

| **Tên Use Case** | Đăng nhập hệ thống |
| --- | --- |
| **Mô tả** | Người dùng xác thực tài khoản để truy cập hệ thống đúng theo vai trò được phân quyền. |
| **Tác nhân** | Sinh viên, Giảng viên, Admin, Phòng Đào tạo |
| **Tiền điều kiện** | Người dùng đã được cấp tài khoản và tài khoản đang hoạt động. |
| **Hậu điều kiện** | Người dùng vào giao diện tương ứng với vai trò; phiên đăng nhập được tạo. |
| **Kích hoạt** | Người dùng nhập tên đăng nhập, mật khẩu và nhấn Đăng nhập. |
| **Luồng chính** | 1. Người dùng mở trang đăng nhập. 2. Hệ thống hiển thị form đăng nhập. 3. Người dùng nhập tên đăng nhập và mật khẩu. 4. Hệ thống kiểm tra thông tin tài khoản. 5. Nếu hợp lệ, hệ thống chuyển người dùng đến dashboard theo vai trò. |
| **Luồng thay thế** | Lần đăng nhập đầu tiên: hệ thống yêu cầu đổi mật khẩu mặc định trước khi vào dashboard. Người dùng quên mật khẩu: chọn chức năng đặt lại mật khẩu qua email. |
| **Ngoại lệ** | Sai thông tin đăng nhập: hiển thị lỗi. Sai 5 lần liên tiếp: tài khoản bị khóa tạm thời và cần Admin mở khóa. Không hoạt động 30 phút: hệ thống tự đăng xuất. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-02: Quản lý thông tin cá nhân

| **Tên Use Case** | Quản lý thông tin cá nhân |
| --- | --- |
| **Mô tả** | Sinh viên xem và cập nhật thông tin liên hệ để phục vụ thông báo và quản lý báo cáo. |
| **Tác nhân** | Sinh viên |
| **Tiền điều kiện** | Sinh viên đã đăng nhập. |
| **Hậu điều kiện** | Thông tin liên hệ hoặc mật khẩu được cập nhật; lịch sử thay đổi được ghi nhận nếu cần. |
| **Kích hoạt** | Sinh viên mở mục Thông tin cá nhân. |
| **Luồng chính** | 1. Sinh viên chọn mục Thông tin cá nhân. 2. Hệ thống hiển thị họ tên, MSSV, lớp, khoa, email trường và thông tin nhóm. 3. Sinh viên cập nhật email cá nhân, số điện thoại hoặc đổi mật khẩu. 4. Hệ thống kiểm tra dữ liệu hợp lệ. 5. Hệ thống lưu thay đổi và hiển thị thông báo thành công. |
| **Luồng thay thế** | Sinh viên chỉ xem thông tin mà không cập nhật. |
| **Ngoại lệ** | Email hoặc số điện thoại sai định dạng: hệ thống hiển thị lỗi. Mật khẩu mới không đạt yêu cầu: hệ thống yêu cầu nhập lại. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-03: Nộp báo cáo

| **Tên Use Case** | Nộp báo cáo |
| --- | --- |
| **Mô tả** | Sinh viên tải lên báo cáo chính (bắt buộc) và các file đính kèm (tùy chọn) để nộp đề tài môn học. File đính kèm có thể gồm source code, dữ liệu, video demo hoặc bất kỳ tài liệu bổ sung nào. |
| **Tác nhân** | Sinh viên |
| **Tiền điều kiện** | Sinh viên đã đăng nhập; đề tài tồn tại; trạng thái báo cáo là CHUA_NOP; còn hạn nộp. |
| **Hậu điều kiện** | File được lưu, thời gian nộp được ghi nhận, trạng thái chuyển sang DA_NOP. |
| **Kích hoạt** | Sinh viên nhấn Nộp báo cáo. |
| **Luồng chính** | 1. Sinh viên mở đề tài cần nộp. 2. Hệ thống hiển thị hạn nộp và form upload. 3. Sinh viên chọn báo cáo chính (bắt buộc, PDF hoặc Word) và upload thêm file đính kèm nếu cần (tùy chọn, nhiều file). 4. Hệ thống kiểm tra định dạng, dung lượng và hạn nộp. 5. Sinh viên xác nhận nộp. 6. Hệ thống lưu file, ghi lịch sử nộp và chuyển trạng thái sang DA_NOP. 7. Hệ thống gửi thông báo xác nhận nộp thành công. |
| **Luồng thay thế** | Sinh viên lưu nháp nếu hệ thống có hỗ trợ; file chưa được tính là đã nộp cho đến khi xác nhận. |
| **Ngoại lệ** | File sai định dạng, vượt 50MB hoặc quá hạn nộp: hệ thống từ chối và hiển thị lý do. Lỗi upload: sinh viên có thể thử lại. |
| **UC liên quan** | `<<include>>` UC-I02 Kiểm tra file nộp; `<<include>>` UC-I03 Gửi thông báo tự động; `<<include>>` UC-I04 Ghi lịch sử trạng thái |

---

### UC-04: Nộp lại báo cáo

| **Tên Use Case** | Nộp lại báo cáo |
| --- | --- |
| **Mô tả** | Sinh viên nộp phiên bản báo cáo đã chỉnh sửa khi trạng thái cho phép. |
| **Tác nhân** | Sinh viên |
| **Tiền điều kiện** | Sinh viên đã đăng nhập; trạng thái báo cáo là CHUA_NOP hoặc YEU_CAU_SUA; còn thời hạn nộp lại hoặc được gia hạn. |
| **Hậu điều kiện** | Phiên bản mới được lưu; lịch sử nộp được cập nhật; trạng thái chuyển về DA_NOP. |
| **Kích hoạt** | Sinh viên chọn Nộp lại báo cáo. |
| **Luồng chính** | 1. Sinh viên mở báo cáo đang cần nộp lại. 2. Hệ thống hiển thị yêu cầu sửa và lịch sử nộp trước đó. 3. Sinh viên upload file đã chỉnh sửa. 4. Hệ thống kiểm tra file và quyền nộp lại. 5. Sinh viên xác nhận nộp lại. 6. Hệ thống lưu phiên bản mới, ghi lịch sử và chuyển trạng thái sang DA_NOP. |
| **Luồng thay thế** | Sinh viên xem lại yêu cầu sửa trước khi chọn file nộp lại. |
| **Ngoại lệ** | Trạng thái không cho phép nộp lại hoặc quá hạn bổ sung: hệ thống khóa chức năng. File không hợp lệ: hệ thống yêu cầu upload lại. |
| **UC liên quan** | `<<include>>` UC-I02 Kiểm tra file nộp; `<<include>>` UC-I03 Gửi thông báo tự động; `<<include>>` UC-I04 Ghi lịch sử trạng thái |

---

### UC-05: Theo dõi tiến độ

| **Tên Use Case** | Theo dõi tiến độ |
| --- | --- |
| **Mô tả** | Sinh viên xem trạng thái hiện tại, lịch sử nộp và lịch sử chuyển trạng thái của báo cáo. |
| **Tác nhân** | Sinh viên |
| **Tiền điều kiện** | Sinh viên đã đăng nhập và có đề tài/báo cáo trong hệ thống. |
| **Hậu điều kiện** | Sinh viên nắm được trạng thái và các mốc xử lý của báo cáo. |
| **Kích hoạt** | Sinh viên mở màn hình Theo dõi tiến độ. |
| **Luồng chính** | 1. Sinh viên chọn đề tài cần theo dõi. 2. Hệ thống hiển thị trạng thái hiện tại. 3. Hệ thống hiển thị lịch sử nộp bài, thời điểm nộp và tên file. 4. Hệ thống hiển thị lịch sử thay đổi trạng thái và người thực hiện. 5. Sinh viên xem thông báo deadline hoặc thông báo trạng thái nếu có. |
| **Luồng thay thế** | Sinh viên lọc lịch sử theo loại: lịch sử nộp, lịch sử trạng thái, thông báo. |
| **Ngoại lệ** | Không có báo cáo hoặc không có quyền xem: hệ thống hiển thị thông báo phù hợp. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-06: Xem điểm và phản hồi

| **Tên Use Case** | Xem điểm và phản hồi |
| --- | --- |
| **Mô tả** | Sinh viên xem điểm và nhận xét của giảng viên khi báo cáo đạt trạng thái HOAN_THANH. Sinh viên xem nội dung cần chỉnh sửa khi báo cáo đạt trạng thái YEU_CAU_SUA. |
| **Tác nhân** | Sinh viên |
| **Tiền điều kiện** | Sinh viên đã đăng nhập; báo cáo có nhận xét hoặc kết quả đã được phê duyệt. |
| **Hậu điều kiện** | Sinh viên xem được điểm, nhận xét hoặc nội dung cần chỉnh sửa. |
| **Kích hoạt** | Sinh viên mở mục Kết quả hoặc Phản hồi. |
| **Luồng chính** | 1. Sinh viên chọn báo cáo cần xem kết quả. 2. Hệ thống kiểm tra trạng thái báo cáo. 3. Nếu trạng thái HOAN_THANH, hệ thống hiển thị điểm tổng, điểm từng tiêu chí và nhận xét. 4. Nếu trạng thái YEU_CAU_SUA, hệ thống hiển thị nội dung cần chỉnh sửa. 5. Sinh viên xem và thực hiện bước tiếp theo nếu cần. |
| **Luồng thay thế** | Sinh viên tải bản nhận xét/bảng điểm nếu hệ thống có hỗ trợ. |
| **Ngoại lệ** | Kết quả chưa được phê duyệt: hệ thống chưa hiển thị điểm cuối cùng. Không có quyền xem: hệ thống từ chối truy cập. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-07: Quản lý danh sách sinh viên

| **Tên Use Case** | Quản lý danh sách sinh viên |
| --- | --- |
| **Mô tả** | Giảng viên xem và lọc danh sách sinh viên/nhóm được phân công để theo dõi việc nộp và chấm báo cáo. |
| **Tác nhân** | Giảng viên |
| **Tiền điều kiện** | Giảng viên đã đăng nhập và có danh sách phân công trong kỳ hiện tại. |
| **Hậu điều kiện** | Giảng viên xem được danh sách và trạng thái xử lý của từng sinh viên/nhóm. |
| **Kích hoạt** | Giảng viên mở màn hình danh sách sinh viên/nhóm. |
| **Luồng chính** | 1. Giảng viên chọn lớp, môn học hoặc kỳ học. 2. Hệ thống hiển thị danh sách sinh viên/nhóm được phân công. 3. Giảng viên lọc theo trạng thái báo cáo. 4. Hệ thống cập nhật danh sách theo điều kiện lọc. 5. Giảng viên chọn một sinh viên/nhóm để xem chi tiết. |
| **Luồng thay thế** | Giảng viên tìm kiếm theo MSSV, tên sinh viên, tên đề tài hoặc nhóm. |
| **Ngoại lệ** | Không có phân công: hệ thống hiển thị danh sách rỗng. Không đủ quyền: hệ thống từ chối truy cập. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-08: Thiết lập phiếu chấm điểm

| **Tên Use Case** | Thiết lập phiếu chấm điểm |
| --- | --- |
| **Mô tả** | Giảng viên tạo hoặc chỉnh sửa phiếu chấm điểm để làm tiêu chí chấm điểm cho đề tài hoặc nhóm đề tài. |
| **Tác nhân** | Giảng viên |
| **Tiền điều kiện** | Giảng viên đã đăng nhập; được phân công môn học/đề tài; phiếu chấm điểm chưa có điểm được nhập. |
| **Hậu điều kiện** | Phiếu chấm điểm được lưu và có thể dùng để chấm điểm. |
| **Kích hoạt** | Giảng viên chọn Tạo hoặc Chỉnh sửa phiếu chấm điểm. |
| **Luồng chính** | 1. Giảng viên mở mục Phiếu chấm điểm. 2. Hệ thống hiển thị danh sách tiêu chí hiện có hoặc form tạo mới. 3. Giảng viên nhập tên tiêu chí, mô tả, thang điểm và trọng số. 4. Hệ thống kiểm tra tổng trọng số/thang điểm. 5. Giảng viên lưu phiếu chấm điểm. 6. Hệ thống lưu phiếu chấm điểm cho đề tài hoặc môn học. |
| **Luồng thay thế** | Giảng viên sao chép phiếu chấm điểm từ môn học/đề tài khác rồi chỉnh sửa lại. |
| **Ngoại lệ** | Phiếu chấm điểm đã có điểm được nhập: hệ thống không cho chỉnh sửa. Tổng trọng số không hợp lệ: hệ thống yêu cầu điều chỉnh. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-09: Chấm điểm báo cáo

| **Tên Use Case** | Chấm điểm báo cáo |
| --- | --- |
| **Mô tả** | Giảng viên xem báo cáo, nhập điểm theo từng tiêu chí phiếu chấm điểm, ghi nhận xét và xác nhận hoàn tất chấm điểm. |
| **Tác nhân** | Giảng viên |
| **Tiền điều kiện** | Giảng viên đã đăng nhập; báo cáo ở trạng thái DA_NOP hoặc DANG_CHAM; phiếu chấm điểm đã được thiết lập. |
| **Hậu điều kiện** | Điểm và nhận xét được lưu; trạng thái chuyển sang DA_CHAM rồi chờ duyệt theo quy trình. |
| **Kích hoạt** | Giảng viên chọn Chấm điểm báo cáo. |
| **Luồng chính** | 1. Giảng viên mở báo cáo cần chấm. 2. Hệ thống hiển thị file báo cáo, tài liệu minh chứng và phiếu chấm điểm. 3. Giảng viên xem trực tiếp hoặc tải file về. 4. Giảng viên nhập điểm từng tiêu chí và nhận xét. 5. Hệ thống tính điểm tổng theo phiếu chấm điểm. 6. Giảng viên xác nhận chấm xong. 7. Hệ thống lưu điểm, khóa chỉnh sửa tạm thời và chuyển trạng thái sang DA_CHAM/CHO_DUYET. |
| **Luồng thay thế** | Giảng viên lưu tạm điểm trong khi chưa xác nhận chấm xong. |
| **Ngoại lệ** | Thiếu phiếu chấm điểm: hệ thống yêu cầu thiết lập phiếu chấm điểm trước. Điểm vượt thang: hệ thống báo lỗi. Sau khi xác nhận, giảng viên không thể sửa trừ khi Phòng Đào tạo trả về. |
| **UC liên quan** | `<<include>>` UC-I05 Tính điểm tổng; `<<include>>` UC-I04 Ghi lịch sử trạng thái; `<<include>>` UC-I03 Gửi thông báo tự động |

---

### UC-10: Gửi yêu cầu sửa

| **Tên Use Case** | Gửi yêu cầu sửa |
| --- | --- |
| **Mô tả** | Giảng viên yêu cầu sinh viên chỉnh sửa báo cáo trước khi chấm chính thức hoặc hoàn tất đánh giá. |
| **Tác nhân** | Giảng viên |
| **Tiền điều kiện** | Giảng viên đã đăng nhập; báo cáo đang ở trạng thái DA_NOP hoặc DANG_CHAM. |
| **Hậu điều kiện** | Yêu cầu sửa được lưu; trạng thái báo cáo chuyển sang YEU_CAU_SUA; sinh viên nhận thông báo. |
| **Kích hoạt** | Giảng viên chọn Yêu cầu sửa. |
| **Luồng chính** | 1. Giảng viên mở báo cáo cần yêu cầu sửa. 2. Giảng viên nhập nội dung yêu cầu chỉnh sửa cụ thể. 3. Hệ thống yêu cầu xác nhận thao tác. 4. Giảng viên xác nhận gửi yêu cầu. 5. Hệ thống lưu ghi chú, chuyển trạng thái sang YEU_CAU_SUA và gửi thông báo cho sinh viên. |
| **Luồng thay thế** | Giảng viên hủy thao tác trước khi xác nhận. |
| **Ngoại lệ** | Nội dung yêu cầu sửa để trống: hệ thống yêu cầu nhập. Báo cáo đã hoàn thành hoặc đã khóa: không cho gửi yêu cầu sửa. |
| **UC liên quan** | `<<include>>` UC-I03 Gửi thông báo tự động; `<<include>>` UC-I04 Ghi lịch sử trạng thái |

---

### UC-11: Xuất báo cáo lớp

| **Tên Use Case** | Xuất báo cáo lớp |
| --- | --- |
| **Mô tả** | Giảng viên xuất bảng điểm hoặc thống kê lớp/môn học mình phụ trách ra Excel hoặc PDF. |
| **Tác nhân** | Giảng viên |
| **Tiền điều kiện** | Giảng viên đã đăng nhập và có quyền xem dữ liệu lớp/môn học. |
| **Hậu điều kiện** | File báo cáo được tạo để tải về. |
| **Kích hoạt** | Giảng viên nhấn Xuất báo cáo. |
| **Luồng chính** | 1. Giảng viên chọn lớp, môn học và kỳ học. 2. Hệ thống hiển thị dữ liệu tổng hợp. 3. Giảng viên chọn định dạng Excel hoặc PDF. 4. Hệ thống tạo file báo cáo. 5. Giảng viên tải file về. |
| **Luồng thay thế** | Giảng viên lọc theo trạng thái, đạt/không đạt hoặc khoảng điểm trước khi xuất. |
| **Ngoại lệ** | Không có dữ liệu phù hợp: hệ thống thông báo không thể xuất. Lỗi tạo file: hệ thống báo lỗi và cho thử lại. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-12: Nhập danh sách phân công

| **Tên Use Case** | Nhập danh sách phân công |
| --- | --- |
| **Mô tả** | Admin nhập dữ liệu phân công môn học, lớp học, giảng viên và sinh viên từ file do Phòng Đào tạo cung cấp. |
| **Tác nhân** | Admin; Hệ thống quản lý sinh viên |
| **Tiền điều kiện** | Admin đã đăng nhập; có file Excel/CSV hợp lệ hoặc nguồn đồng bộ. |
| **Hậu điều kiện** | Dữ liệu phân công được lưu; lỗi dữ liệu được báo rõ nếu có. |
| **Kích hoạt** | Admin chọn Nhập danh sách phân công. |
| **Luồng chính** | 1. Admin chọn file Excel/CSV hoặc nguồn đồng bộ. 2. Hệ thống đọc dữ liệu và kiểm tra cấu trúc. 3. Hệ thống kiểm tra trùng lặp, thiếu thông tin hoặc sai mã. 4. Admin xem kết quả kiểm tra. 5. Admin xác nhận nhập dữ liệu. 6. Hệ thống lưu dữ liệu phân công và ghi log. |
| **Luồng thay thế** | Admin tải file mẫu để nhập dữ liệu đúng cấu trúc. |
| **Ngoại lệ** | File sai cấu trúc hoặc dữ liệu lỗi: hệ thống hiển thị danh sách dòng lỗi và không nhập các dòng không hợp lệ. |
| **UC liên quan** | `<<include>>` UC-I06 Đồng bộ dữ liệu; `<<include>>` UC-I04 Ghi lịch sử trạng thái |

---

### UC-13: Cấp phân quyền tài khoản

| **Tên Use Case** | Cấp phân quyền tài khoản |
| --- | --- |
| **Mô tả** | Admin tạo tài khoản, gán vai trò, khóa/mở tài khoản, đặt lại mật khẩu hoặc vô hiệu hóa tài khoản. |
| **Tác nhân** | Admin |
| **Tiền điều kiện** | Admin đã đăng nhập và có quyền quản trị tài khoản. |
| **Hậu điều kiện** | Tài khoản được tạo/cập nhật trạng thái/quyền; thao tác được ghi log. |
| **Kích hoạt** | Admin mở chức năng Quản lý tài khoản. |
| **Luồng chính** | 1. Admin chọn tạo thủ công hoặc nhập hàng loạt. 2. Hệ thống hiển thị form hoặc mẫu import. 3. Admin nhập thông tin tài khoản và vai trò. 4. Hệ thống kiểm tra trùng tên đăng nhập. 5. Admin xác nhận thao tác. 6. Hệ thống tạo/cập nhật tài khoản, gán vai trò và ghi log. |
| **Luồng thay thế** | Admin khóa/mở khóa, đặt lại mật khẩu hoặc vô hiệu hóa tài khoản hiện có. |
| **Ngoại lệ** | Tên đăng nhập trùng hoặc thiếu vai trò: hệ thống báo lỗi. Admin không được xóa tài khoản nếu cần bảo toàn lịch sử. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập; `<<include>>` UC-I03 Gửi thông báo tự động |

---

### UC-14: Cấu hình hệ thống

| **Tên Use Case** | Cấu hình hệ thống |
| --- | --- |
| **Mô tả** | Admin cấu hình các tham số vận hành như thang điểm, công thức tính điểm, định dạng file, dung lượng và thông báo. |
| **Tác nhân** | Admin |
| **Tiền điều kiện** | Admin đã đăng nhập và có quyền cấu hình hệ thống. |
| **Hậu điều kiện** | Cấu hình được lưu và áp dụng theo phạm vi/kỳ học phù hợp. |
| **Kích hoạt** | Admin mở mục Cấu hình hệ thống. |
| **Luồng chính** | 1. Admin chọn nhóm cấu hình cần thay đổi. 2. Hệ thống hiển thị cấu hình hiện tại. 3. Admin nhập giá trị mới. 4. Hệ thống kiểm tra tính hợp lệ. 5. Admin xác nhận lưu. 6. Hệ thống cập nhật cấu hình và ghi log. |
| **Luồng thay thế** | Admin bật/tắt kiểm tra đạo văn hoặc cấu hình nội dung thông báo. |
| **Ngoại lệ** | Giá trị cấu hình không hợp lệ: hệ thống từ chối lưu. Cấu hình ảnh hưởng điểm đã khóa: hệ thống chỉ cho áp dụng từ kỳ sau. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-15: Xử lý vi phạm

| **Tên Use Case** | Xử lý vi phạm |
| --- | --- |
| **Mô tả** | Admin hoặc giảng viên từ chối báo cáo khi phát hiện đạo văn, nộp sai đề tài hoặc sai định dạng nghiêm trọng. |
| **Tác nhân** | Admin, Giảng viên |
| **Tiền điều kiện** | Người xử lý đã đăng nhập; báo cáo có dấu hiệu vi phạm và chưa hoàn thành cuối cùng. |
| **Hậu điều kiện** | Báo cáo chuyển sang TU_CHOI; lý do từ chối được lưu; sinh viên nhận thông báo. |
| **Kích hoạt** | Admin hoặc giảng viên chọn Từ chối báo cáo. |
| **Luồng chính** | 1. Người xử lý mở báo cáo cần kiểm tra. 2. Hệ thống hiển thị thông tin báo cáo và kết quả kiểm tra liên quan. 3. Người xử lý nhập lý do từ chối. 4. Hệ thống yêu cầu xác nhận. 5. Người xử lý xác nhận. 6. Hệ thống chuyển trạng thái sang TU_CHOI, ghi lịch sử và gửi thông báo. |
| **Luồng thay thế** | Nếu còn thời hạn bổ sung, sinh viên có thể nộp lại sau khi báo cáo bị từ chối. |
| **Ngoại lệ** | Không nhập lý do từ chối: hệ thống không cho xác nhận. Báo cáo đã khóa cuối kỳ: không thể từ chối. |
| **UC liên quan** | `<<include>>` UC-I03 Gửi thông báo tự động; `<<include>>` UC-I04 Ghi lịch sử trạng thái |

---

### UC-16: Phê duyệt kết quả

| **Tên Use Case** | Phê duyệt kết quả |
| --- | --- |
| **Mô tả** | Phòng Đào tạo kiểm tra và phê duyệt kết quả chấm điểm cuối cùng hoặc trả về cho giảng viên chấm lại. |
| **Tác nhân** | Phòng Đào tạo |
| **Tiền điều kiện** | Phòng Đào tạo đã đăng nhập; có báo cáo ở trạng thái CHO_DUYET. |
| **Hậu điều kiện** | Nếu duyệt, trạng thái chuyển sang HOAN_THANH và điểm được công bố; nếu trả về, trạng thái chuyển về DANG_CHAM kèm lý do. |
| **Kích hoạt** | Phòng Đào tạo mở danh sách kết quả chờ duyệt. |
| **Luồng chính** | 1. Phòng Đào tạo xem danh sách báo cáo chờ duyệt. 2. Hệ thống hiển thị điểm chi tiết, điểm tổng và nhận xét. 3. Phòng Đào tạo kiểm tra thông tin. 4. Phòng Đào tạo chọn Phê duyệt. 5. Hệ thống chuyển trạng thái sang HOAN_THANH, công bố điểm và gửi thông báo. |
| **Luồng thay thế** | Phòng Đào tạo chọn Trả về chấm lại, nhập lý do; hệ thống chuyển trạng thái về DANG_CHAM và thông báo cho giảng viên. |
| **Ngoại lệ** | Thiếu điểm hoặc thiếu nhận xét bắt buộc: hệ thống không cho phê duyệt. Không có quyền phê duyệt: hệ thống từ chối truy cập. |
| **UC liên quan** | `<<include>>` UC-I03 Gửi thông báo tự động; `<<include>>` UC-I04 Ghi lịch sử trạng thái |

---

### UC-17: Điều chỉnh phân công

| **Tên Use Case** | Điều chỉnh phân công |
| --- | --- |
| **Mô tả** | Phòng Đào tạo điều chỉnh giảng viên phụ trách khi có thay đổi phân công hoặc sự cố trong kỳ. |
| **Tác nhân** | Phòng Đào tạo, Admin |
| **Tiền điều kiện** | Phòng Đào tạo đã đăng nhập; có dữ liệu lớp/môn học/giảng viên trong hệ thống. |
| **Hậu điều kiện** | Phân công được cập nhật hoặc yêu cầu Admin cập nhật; lịch sử thay đổi được ghi nhận. |
| **Kích hoạt** | Phòng Đào tạo chọn Điều chỉnh phân công. |
| **Luồng chính** | 1. Phòng Đào tạo chọn lớp, môn học hoặc đề tài cần điều chỉnh. 2. Hệ thống hiển thị phân công hiện tại. 3. Phòng Đào tạo chọn giảng viên mới và nhập lý do. 4. Hệ thống kiểm tra dữ liệu hợp lệ. 5. Phòng Đào tạo xác nhận thay đổi. 6. Hệ thống cập nhật phân công và ghi lịch sử. |
| **Luồng thay thế** | Phòng Đào tạo gửi yêu cầu để Admin cập nhật dữ liệu phân công khi quy trình yêu cầu. |
| **Ngoại lệ** | Giảng viên mới không tồn tại hoặc không thuộc môn/lớp phù hợp: hệ thống báo lỗi. Báo cáo đã khóa cuối kỳ: không cho điều chỉnh. |
| **UC liên quan** | `<<include>>` UC-I04 Ghi lịch sử trạng thái; `<<include>>` UC-I03 Gửi thông báo tự động |

---

### UC-18: Giám sát tiến độ

| **Tên Use Case** | Giám sát tiến độ |
| --- | --- |
| **Mô tả** | Phòng Đào tạo hoặc Admin theo dõi tiến độ nộp, chấm và phê duyệt theo lớp, môn học, giảng viên và kỳ học. |
| **Tác nhân** | Phòng Đào tạo, Admin |
| **Tiền điều kiện** | Người dùng đã đăng nhập và có quyền xem thống kê. |
| **Hậu điều kiện** | Tiến độ được hiển thị để phục vụ quản lý và nhắc nhở. |
| **Kích hoạt** | Người dùng mở dashboard giám sát tiến độ. |
| **Luồng chính** | 1. Người dùng chọn kỳ học, lớp, môn học hoặc giảng viên. 2. Hệ thống tổng hợp số lượng báo cáo theo trạng thái. 3. Hệ thống hiển thị danh sách sinh viên chưa nộp, đang chấm, chờ duyệt, hoàn thành. 4. Người dùng lọc hoặc xuất dữ liệu nếu cần. 5. Hệ thống hiển thị kết quả theo bộ lọc. |
| **Luồng thay thế** | Người dùng xem biểu đồ/thống kê phân bố điểm nếu có dữ liệu điểm. |
| **Ngoại lệ** | Không có dữ liệu trong kỳ học đã chọn: hệ thống hiển thị dữ liệu rỗng. Không đủ quyền: hệ thống từ chối truy cập. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-19: Khóa kết quả cuối kỳ

| **Tên Use Case** | Khóa kết quả cuối kỳ |
| --- | --- |
| **Mô tả** | Admin khóa toàn bộ kết quả cuối kỳ sau khi Phòng Đào tạo xác nhận đã phê duyệt đầy đủ. |
| **Tác nhân** | Admin; Phòng Đào tạo |
| **Tiền điều kiện** | Admin đã đăng nhập; toàn bộ kết quả cần khóa đã được Phòng Đào tạo phê duyệt. |
| **Hậu điều kiện** | Điểm số được khóa, không ai có thể chỉnh sửa; file dữ liệu điểm cuối kỳ có thể được xuất. |
| **Kích hoạt** | Admin chọn Khóa kết quả cuối kỳ. |
| **Luồng chính** | 1. Admin chọn kỳ học và phạm vi cần khóa. 2. Hệ thống kiểm tra trạng thái phê duyệt của toàn bộ kết quả. 3. Hệ thống hiển thị cảnh báo trước khi khóa. 4. Admin xác nhận khóa. 5. Hệ thống khóa điểm, ghi log và cho phép xuất dữ liệu lưu trữ. |
| **Luồng thay thế** | Admin hủy thao tác nếu phát hiện còn kết quả chưa được duyệt. |
| **Ngoại lệ** | Còn báo cáo chưa HOAN_THANH: hệ thống không cho khóa. Admin không có xác nhận từ Phòng Đào tạo: không thực hiện khóa. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-20: Sao lưu phục hồi dữ liệu

| **Tên Use Case** | Sao lưu phục hồi dữ liệu |
| --- | --- |
| **Mô tả** | Admin sao lưu dữ liệu định kỳ/thủ công và phục hồi dữ liệu khi xảy ra sự cố. |
| **Tác nhân** | Admin |
| **Tiền điều kiện** | Admin đã đăng nhập và có quyền vận hành dữ liệu. |
| **Hậu điều kiện** | Bản sao lưu được tạo hoặc dữ liệu được phục hồi từ bản sao lưu hợp lệ. |
| **Kích hoạt** | Admin chọn Sao lưu hoặc Phục hồi dữ liệu. |
| **Luồng chính** | 1. Admin mở mục Sao lưu/Phục hồi. 2. Hệ thống hiển thị danh sách bản sao lưu hiện có. 3. Admin chọn tạo bản sao lưu mới hoặc chọn bản sao lưu để phục hồi. 4. Hệ thống yêu cầu xác nhận thao tác. 5. Admin xác nhận. 6. Hệ thống thực hiện sao lưu/phục hồi và ghi log. |
| **Luồng thay thế** | Hệ thống tự động sao lưu định kỳ theo cấu hình mà không cần Admin khởi tạo thủ công. |
| **Ngoại lệ** | Bản sao lưu lỗi hoặc không tương thích: hệ thống từ chối phục hồi. Thiếu dung lượng lưu trữ: hệ thống cảnh báo. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-21: Xem nhật ký hệ thống

| **Tên Use Case** | Xem nhật ký hệ thống |
| --- | --- |
| **Mô tả** | Admin xem lịch sử đăng nhập/đăng xuất, thao tác quan trọng và hoạt động bất thường để hỗ trợ vận hành. |
| **Tác nhân** | Admin |
| **Tiền điều kiện** | Admin đã đăng nhập và có quyền xem log. |
| **Hậu điều kiện** | Admin tra cứu được log theo thời gian, người dùng, loại thao tác hoặc mức độ bất thường. |
| **Kích hoạt** | Admin mở mục Nhật ký hệ thống. |
| **Luồng chính** | 1. Admin mở màn hình Nhật ký hệ thống. 2. Hệ thống hiển thị bộ lọc theo thời gian, người dùng và loại thao tác. 3. Admin nhập điều kiện lọc. 4. Hệ thống trả về danh sách log phù hợp. 5. Admin xem chi tiết log hoặc xuất log nếu cần. |
| **Luồng thay thế** | Admin lọc riêng các hoạt động bất thường để kiểm tra bảo mật. |
| **Ngoại lệ** | Không có log phù hợp: hệ thống hiển thị danh sách rỗng. Không đủ quyền: hệ thống từ chối truy cập. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập |

---

### UC-22: Trao đổi qua bình luận

| **Tên Use Case** | Trao đổi qua bình luận |
| --- | --- |
| **Mô tả** | Giảng viên và sinh viên trao đổi, hỏi đáp qua phần bình luận gắn với báo cáo đề tài. Giảng viên đọc và trả lời câu hỏi của sinh viên, sinh viên gửi câu hỏi và xem phản hồi. Cả hai bên có thể xem lại lịch sử trao đổi. |
| **Tác nhân** | Giảng viên, Sinh viên |
| **Tiền điều kiện** | Người dùng đã đăng nhập; báo cáo đề tài tồn tại trong hệ thống và người dùng có quyền truy cập báo cáo đó. |
| **Hậu điều kiện** | Bình luận được lưu và hiển thị cho cả hai bên, lịch sử trao đổi được cập nhật. |
| **Kích hoạt** | Giảng viên hoặc sinh viên mở phần bình luận của báo cáo và nhập nội dung trao đổi. |
| **Luồng chính** | 1. Người dùng mở trang chi tiết báo cáo đề tài. 2. Hệ thống hiển thị phần bình luận kèm lịch sử trao đổi trước đó. 3. Người dùng nhập nội dung bình luận mới. 4. Hệ thống kiểm tra nội dung không được để trống. 5. Người dùng xác nhận gửi. 6. Hệ thống lưu bình luận, ghi nhận thời gian và người gửi, hiển thị bình luận mới lên danh sách. 7. Hệ thống gửi thông báo đến bên còn lại. |
| **Luồng thay thế** | Người dùng chỉ xem lịch sử trao đổi mà không gửi bình luận mới. |
| **Ngoại lệ** | Nội dung bình luận để trống: hệ thống không cho gửi và hiển thị thông báo lỗi. Báo cáo đã bị khóa cuối kỳ hoặc trạng thái HOAN_THANH không cho phép gửi thêm bình luận: hệ thống ẩn ô nhập và chỉ hiển thị lịch sử. |
| **UC liên quan** | `<<include>>` UC-I01 Kiểm tra quyền truy cập; `<<include>>` UC-I03 Gửi thông báo tự động |

---

### UC-23: Gửi yêu cầu nộp lại báo cáo

| **Tên Use Case** | Gửi yêu cầu nộp lại báo cáo |
| --- | --- |
| **Mô tả** | Sinh viên gửi yêu cầu xin nộp lại khi phát hiện nộp sai file sau khi đã nộp; giảng viên xem xét và phê duyệt hoặc từ chối. |
| **Tác nhân** | Sinh viên, Giảng viên |
| **Tiền điều kiện** | Sinh viên đã đăng nhập; trạng thái báo cáo đang là DA_NOP. |
| **Hậu điều kiện** | Nếu được duyệt: sinh viên được phép nộp lại (vào luồng UC-04). Nếu từ chối: bài nộp cũ giữ nguyên. |
| **Kích hoạt** | Sinh viên nhấn "Yêu cầu nộp lại". |
| **Luồng chính** | 1. Sinh viên mở báo cáo đang ở trạng thái DA_NOP. 2. Sinh viên chọn "Yêu cầu nộp lại" và nhập lý do. 3. Hệ thống lưu yêu cầu vào bảng YeuCauNopLai và gửi thông báo cho giảng viên. 4. Giảng viên xem yêu cầu và chọn đồng ý hoặc từ chối. 5. Nếu đồng ý: hệ thống mở chức năng nộp lại cho sinh viên. 6. Nếu từ chối: hệ thống gửi thông báo lý do đến sinh viên. |
| **Ngoại lệ** | Lý do để trống: hệ thống không cho gửi. Trạng thái không phải DA_NOP: hệ thống ẩn chức năng này. |
| **UC liên quan** | `<<include>>` UC-I03 Gửi thông báo tự động; `<<extend>>` UC-04 Nộp lại báo cáo |

---

## 7. Ghi chú thiết kế nghiệp vụ

- Admin có toàn quyền kỹ thuật nhưng không tự phê duyệt nội dung điểm cuối cùng.
- Phòng Đào tạo là tác nhân duy nhất phê duyệt kết quả chấm điểm cuối cùng.
- Sau khi điểm đã được khóa cuối kỳ, không actor nào được chỉnh sửa điểm trực tiếp.
- Mỗi lần thay đổi trạng thái báo cáo cần ghi nhận lịch sử và gửi thông báo phù hợp.
- Phiếu chấm điểm không được chỉnh sửa sau khi đã có điểm được nhập, trừ khi quy trình trả về chấm lại cho phép.

---

## Tài liệu tham khảo nội bộ

- `Doi_Tuong_Su_Dung.docx` — mô tả đối tượng sử dụng, quyền hạn và trạng thái báo cáo.
- `Xac_Dinh_Yeu_Cau.docx` — danh sách yêu cầu chức năng nghiệp vụ, hệ thống và chất lượng.
- `Huong_Dan_Use_Case_Modeling.docx` — cấu trúc tài liệu Use Case Modeling và cách viết đặc tả Use Case.
