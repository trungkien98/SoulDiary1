# 📔 SoulDiary API - Hướng Dẫn Endpoint (Tiếng Việt)

## 🔐 Authentication (Xác Thực)

### 1. Đăng Ký Tài Khoản
```
POST /api/v1/auth/register
Mô tả: Tạo tài khoản mới bằng email và mật khẩu
Yêu cầu: name, email, password (tối thiểu 8 ký tự)
Trả về: Xác nhận đăng ký + gửi email xác thực
```

### 2. Đăng Nhập
```
POST /api/v1/auth/login
Mô tả: Đăng nhập bằng email và mật khẩu
Yêu cầu: email, password
Trả về: access_token, refresh_token, user info
```

### 3. Đăng Nhập với Google
```
POST /api/v1/auth/google
Mô tả: Đăng nhập/Đăng ký tự động qua Google OAuth
Yêu cầu: idToken (từ Google)
Trả về: access_token, refresh_token, user info
```

### 4. Xác Thực Email
```
GET /api/v1/auth/verify-email/:token
Mô tả: Xác nhận địa chỉ email (link từ email)
Yêu cầu: token (từ email xác thực)
Trả về: Tài khoản đã xác nhận
```

### 5. Quên Mật Khẩu
```
POST /api/v1/auth/forgot-password
Mô tả: Yêu cầu đặt lại mật khẩu
Yêu cầu: email
Trả về: Link đặt lại gửi đến email
```

### 6. Đặt Lại Mật Khẩu
```
PATCH /api/v1/auth/reset-password/:token
Mô tả: Đặt mật khẩu mới (sử dụng token từ email)
Yêu cầu: newPassword, passwordConfirm
Trả về: Mật khẩu đã được cập nhật, access_token mới
```

### 7. Làm Mới Token
```
POST /api/v1/auth/refresh-token
Mô tả: Lấy access_token mới từ refresh_token
Yêu cầu: refresh_token
Trả về: access_token mới, refresh_token mới
```

### 8. Đăng Xuất
```
POST /api/v1/auth/logout
Mô tả: Đăng xuất và xóa refresh_token
Yêu cầu: Authentication (Bearer token)
Trả về: Thông báo đăng xuất thành công
```

---

## 📔 Journal - Nhật Ký (Yêu cầu đăng nhập)

### 1. Tạo Nhật Ký Mới
```
POST /api/v1/journals
Mô tả: Tạo bài viết nhật ký mới
Yêu cầu (bắt buộc): content
Yêu cầu (tùy chọn): title, mood, tags, entryDate, isPublic
Mood: happy, sad, angry, anxious, neutral, excited, tired
Tags: personal, growth, achievement, reflection, healing, relationships, career, health, creative, gratitude
Trả về: Journal object + streak info (số ngày liên tiếp viết)
```

### 2. Xem Danh Sách Nhật Ký của Tôi
```
GET /api/v1/journals
Mô tả: Lấy danh sách tất cả nhật ký của bạn (có phân trang + lọc)

Tham số tìm kiếm:
  - page: Số trang (mặc định: 1)
  - limit: Số bài trên trang (mặc định: 10, tối đa: 50)
  - q: Tìm kiếm (trong tiêu đề, nội dung, tags)
  - mood: Lọc theo tâm trạng
  - tag: Lọc theo tag
  - from: Từ ngày (format: 2026-03-01T00:00:00.000Z)
  - to: Đến ngày (format: 2026-03-10T23:59:59.999Z)

Trả về: Danh sách nhật ký + thông tin phân trang
```

### 3. Xem Chi Tiết Nhật Ký
```
GET /api/v1/journals/{id}
Mô tả: Lấy toàn bộ nội dung của một bài nhật ký cụ thể
Yêu cầu: journal ID (MongoDB ObjectId)
Trả về: Chi tiết đầy đủ bài nhật ký + user info
```

### 4. Cập Nhật Nhật Ký
```
PATCH /api/v1/journals/{id}
Mô tả: Chỉnh sửa bài nhật ký (có thể cập nhật từng phần)
Yêu cầu: Ít nhất một trong: title, content, mood, tags, entryDate
Trả về: Nhật ký đã cập nhật
```

### 5. Xóa Nhật Ký (Xóa Mềm)
```
DELETE /api/v1/journals/{id}
Mô tả: Xóa nhật ký (đánh dấu xóa, không xóa vĩnh viễn)
Yêu cầu: journal ID
Trả về: Xác nhận xóa + deletedAt timestamp
```

### 6. Khôi Phục Nhật Ký Đã Xóa
```
PATCH /api/v1/journals/{id}/restore
Mô tả: Khôi phục bài nhật ký đã xóa trước đó
Yêu cầu: journal ID (của bài đã xóa)
Trả về: Nhật ký đã khôi phục (deletedAt = null, isDeleted = false)
```

### 7. Thay Đổi Chế Độ Công Khai/Riêng Tư
```
PATCH /api/v1/journals/{id}/visibility
Mô tả: Chia sẻ công khai hoặc ẩn riêng tư
Yêu cầu: isPublic (true = công khai, false = riêng tư)
Trả về: Nhật ký với cập nhật isPublic
```

---

## 👤 User - Người Dùng (Yêu cầu đăng nhập)

### 1. Xem Thông Tin Hồ Sơ
```
GET /api/v1/users/me
Mô tả: Lấy thông tin cá nhân của bạn
Trả về: User object (name, email, avatar, role, streak info)
```

### 2. Cập Nhật Hồ Sơ
```
PATCH /api/v1/users/update-me
Mô tả: Cập nhật avatar, name, email
Yêu cầu (tùy chọn): avatar, name, email
Trả về: Thông tin người dùng đã cập nhật
```

### 3. Thay Đổi Mật Khẩu
```
PATCH /api/v1/users/update-password
Mô tả: Đổi mật khẩu (cần mật khẩu cũ)
Yêu cầu: passwordCurrent, password, passwordConfirm
Trả về: access_token mới, refresh_token mới
```

### 4. Xóa Tài Khoản
```
DELETE /api/v1/users/delete-me
Mô tả: Xóa tài khoản vĩnh viễn (cần xác nhận mật khẩu)
Yêu cầu: password
Trả về: Xác nhận xóa tài khoản
```

---

## 🔐 OTP - Mã Xác Thực (Yêu cầu đăng nhập)

### 1. Gửi OTP
```
POST /api/v1/otp/send
Mô tả: Gửi mã OTP đến email người dùng
Yêu cầu: email
Trả về: Thông báo gửi OTP thành công
```

### 2. Xác Minh OTP
```
POST /api/v1/otp/verify
Mô tả: Kiểm tra OTP có hợp lệ không
Yêu cầu: email, otp
Trả về: Xác nhận OTP hợp lệ
```

---

## 📧 Mail Test - Kiểm Tra Email

### 1. Gửi Email Test
```
POST /api/v1/mail/send-test
Mô tả: Gửi email kiểm tra (dùng cho debug)
Yêu cầu: email, subject, content
Trả về: Xác nhận gửi email
```

---

## 📊 Thông Tin Bổ Sung

### Mood (Tâm Trạng)
- `happy` - Vui vẻ 😊
- `sad` - Buồn bã 😢
- `angry` - Tức giận 😠
- `anxious` - Lo lắng 😰
- `neutral` - Bình thường 😐
- `excited` - Phấn khích 🤩
- `tired` - Mệt mỏi 😴

### Tags (Thẻ Phân Loại)
- `personal` - Cá nhân
- `growth` - Phát triển bản thân
- `achievement` - Thành tích
- `reflection` - Deep reflection
- `healing` - Chữa lành/Bình phục
- `relationships` - Quan hệ xã hội
- `career` - Sự nghiệp
- `health` - Sức khỏe
- `creative` - Sáng tạo
- `gratitude` - Biết ơn

### Stripe System (Hệ Thống Liên Tiếp)
- `streakCount` - Số ngày liên tiếp viết nhật ký
- `bestStreak` - Kỷ lục liên tiếp cao nhất
- `lastStreakDate` - Ngày ghi nhập cuối cùng

### Response Status
- `success` - Thành công 200/201
- `fail` - Lỗi phía client 400
- `error` - Lỗi phía server 500

### Pagination (Phân Trang)
```javascript
{
  "page": 1,           // Trang hiện tại
  "limit": 10,        // Số item trên trang
  "total": 50,        // Tổng số item
  "pages": 5          // Tổng số trang
}
```

### Token Management (Quản Lý Token)
- **Access Token**: Dùng cho các request API (hết hạn nhanh)
- **Refresh Token**: Dùng để lấy access_token mới (thời gian dài)
- **Cách sử dụng**: Header `Authorization: Bearer <access_token>`

---

## 🚀 VÍ DỤ SỬ DỤNG

### Ví dụ 1: Đăng ký và tạo nhật ký
```bash
# 1. Đăng ký
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "password": "MySecurePassword123!"
  }'

# 2. Đăng nhập
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MySecurePassword123!"
  }'

# 3. Tạo nhật ký (sử dụng access_token)
curl -X POST http://localhost:3000/api/v1/journals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Ngày đầu tiên",
    "content": "Hôm nay là một ngày tuyệt vời...",
    "mood": "happy",
    "tags": ["personal", "growth"],
    "isPublic": false
  }'
```

### Ví dụ 2: Tìm kiếm nhật ký theo tâm trạng
```bash
curl -X GET "http://localhost:3000/api/v1/journals?mood=happy&tag=growth&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Ví dụ 3: Lọc nhật ký theo ngày
```bash
curl -X GET "http://localhost:3000/api/v1/journals?from=2026-03-01T00:00:00.000Z&to=2026-03-10T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Ví dụ 4: Xóa và khôi phục nhật ký
```bash
# Xóa nhật ký
curl -X DELETE http://localhost:3000/api/v1/journals/JOURNAL_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Khôi phục nhật ký
curl -X PATCH http://localhost:3000/api/v1/journals/JOURNAL_ID/restore \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

**Cập nhật lần cuối**: March 6, 2026
**API Base URL**: `https://souldiary.vercel.app` (Vercel) hoặc `http://localhost:3000` (Local)
