# Danh sách Công việc Triển khai (Task Breakdown v7) — Hoài Thương Wedding

## Phase 0A: Spike Zalo Login (1–2 giờ — Làm TRƯỚC khi chốt schema)
- [x] Khởi tạo Next.js 16 (App Router, TypeScript strict, Tailwind CSS, ESLint, Prettier) tại `d:\WORK\hoai-thuong-wedding`
- [x] Gắn thẻ xác thực Zalo (`zalo-platform-site-verification`) từ env trong `src/app/layout.tsx` + file xác thực HTML trong `public/`
- [x] Dựng trang `/zalo-spike` + các route `/api/auth/zalo`, `/api/auth/zalo/callback`, `/api/auth/zalo/logout`, `/api/health` (OAuth v4 + PKCE + `/v2.0/me`)
- [x] Cấu hình `render.yaml` (Render Free Singapore), GitHub Actions CI (`typecheck` + `lint` + `build`), Security Headers trong `next.config.ts` và `.env.example`
- [x] Deploy lên VPS Việt Nam (`160.187.229.48` + `https://160-187-229-48.sslip.io` với Node 22 + PM2 + Caddy HTTPS), xác thực URL + Callback URL trên `developers.zalo.me` và kiểm chứng thành công Zalo Login OAuth v4 + PKCE trả về đầy đủ `id`, `name`, `picture`, `is_sensitive`

## Phase 0B: Chốt Basecode, Database (2 URL Neon) & Bảo mật (DAL)
- [x] Cài đặt nền tảng UI Kit (`lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`), `react-hook-form`, `zod`, `bcryptjs`, `cloudinary` và cấu hình bảng màu từ `docs-1.md`
- [x] Cấu hình Drizzle ORM với **2 biến môi trường Neon (Region Singapore)**: `DATABASE_URL` (Pooled `-pooler`, dùng `pg.Pool({ max: 5, idleTimeoutMillis: 30000 })` + `pool.on('error')` cho app) và `DATABASE_URL_UNPOOLED` (Direct, dùng cho `drizzle-kit` migration & `pg_dump`)
- [x] Viết schema **8 bảng** (`users`, `sessions`, `login_attempts`, `invite_tokens`, `staff_profiles`, `shows`, `registrations`, `audit_logs`): bỏ `eventDate` (suy từ `gatherAt` theo `Asia/Ho_Chi_Minh`), enum `aoDaiSize` (`S..3XL`), cột `allowanceNote`, `verifiedBy`/`verifiedAt`, `reviewedBy`/`reviewedAt`/`cancelledBy`/`cancelledAt`/`cancelReason`, `UNIQUE(show_id, user_id)` và `UNIQUE(identifier, ip_address)`
- [x] Kiểm chứng khóa dòng `SELECT ... FROM shows WHERE id = $1 FOR UPDATE` trên kết nối Neon Pooled bằng bài test 2 transaction chạy song song (`pnpm db:test-lock` PASS)
- [x] Tổ chức thư mục `src/server/` (`dal/`, `services/`, `db/`, `lib/`); xây dựng `src/proxy.ts` (Next.js 16) và DAL (`requireUser()`, `requireAdmin()` xác thực trực tiếp bảng `sessions` + `users.status`)
- [x] Xây dựng Cloudinary upload `type: 'authenticated'` + route bảo vệ ảnh **`GET /api/photos/[staffId]`** (kiểm tra quyền trong DB trước khi trả ảnh kèm `Cache-Control: private`)
- [x] Viết script `db:seed` (1 Admin gắn Zalo ID, 4 nhân sự Nam/Nữ, 2 show mẫu) và chạy thành công lên Neon Singapore

## Phase 1: Xác thực đầy đủ, Rate Limit 2 tầng, Onboarding & Tab Profile 4 Ảnh
- [x] Hoàn thiện Zalo Login (OAuth v4 + PKCE) nối vào bảng `users` + `sessions` (qua Link mời 1 lần → `ACTIVE`; tự đăng nhập mới → `PENDING_APPROVAL`)
- [x] Triển khai Đăng nhập SĐT + Mật khẩu kèm Rate Limit 2 tầng trên `login_attempts`: khóa tạm theo cặp `UNIQUE(identifier, ipAddress)` + progressive delay theo tổng `identifier`
- [x] Admin: Tạo nhân sự khung → sinh Link kích hoạt 1 lần (`invite_tokens`, 72h), xác minh `PENDING_APPROVAL -> ACTIVE` (`verifiedBy`, `verifiedAt`), khóa `SUSPENDED` (thu hồi toàn bộ `sessions` tức thì), xem tối đa 4 ảnh cá nhân và ghi `audit_logs`
- [x] Form Onboarding tối thiểu 6 trường (Size áo `S..3XL`) + nén ảnh Client Canvas + upload Cloudinary `authenticated` (tối ưu 3 lớp `1080×1440` WebP + `thumb`/`full`) + checkbox đồng ý NĐ 356/2025/NĐ-CP
- [x] Tab Hồ sơ cá nhân (`/staff/profile`): nhân sự tự cập nhật chiều cao, cân nặng, size áo dài và quản lý tối đa 4 ảnh cá nhân (tách biệt Avatar Zalo; tự xóa ảnh cũ trên Cloudinary khi thay thế & chống upload ảnh trùng bằng SHA-256)
- [x] Tính năng quyền dữ liệu cá nhân: Xuất dữ liệu cá nhân (JSON `GET /api/me/export`) & Xóa/Ẩn danh tài khoản (xóa toàn bộ ảnh trên Cloudinary + thu hồi `sessions`, giữ lại bản ghi thanh toán ẩn danh)

## Phase 2: Quản lý Show (Admin) & Đăng ký / Tự hủy bảo vệ Waitlist (Staff)
- [x] Admin: CRUD Show (`requireAdmin()`; Slot Nam/Nữ riêng, `gatherAt`/`endAt` `timestamptz` hiển thị `Asia/Ho_Chi_Minh`, địa chỉ, quận, `wagePerPerson`, `allowanceNote`, trang phục, link group Zalo, thông tin khách chỉ Admin thấy); khi sửa `requiredMale`/`requiredFemale` bắt buộc khóa dòng show (`withLockedShow`), chặn giảm thấp hơn số đã `APPROVED` và ghi `audit_logs`
- [x] Admin: Màn hình Lịch theo ngày (nhiều show song song) & nút Copy tin tuyển show
- [x] Trang công khai `/shows/[id]` (không cần đăng nhập để Zalo bot đọc Open Graph; chỉ hiện thông tin tuyển dụng công khai)
- [x] Staff (Mobile-First): Bảng tin Show đang mở & Server Action đăng ký 1 chạm (`requireUser()` — cho phép cả `PENDING_APPROVAL` đã điền đủ hồ sơ đăng ký ngay, không chặn cứng trùng lịch, dùng **upsert** hỗ trợ đăng ký lại sau hủy)
- [x] Staff: Tự hủy đăng ký (tự do khi `PENDING`/`WAITLIST`; khi `APPROVED` chỉ cho tự hủy trước `gatherAt` ≥ 24h trong `withLockedShow`, lưu `cancelledBy`/`cancelledAt`/`cancelReason` + `audit_logs`: nếu có `WAITLIST` cùng giới tính thì giữ đóng công khai chờ Admin đôn dự bị, chỉ khi `WAITLIST` trống mới mở lại `OPEN`)

## Phase 3: Duyệt nhanh, Xác minh Danh tính & Khóa Slot Transaction
- [x] Admin: Hiển thị khối xác minh (**Tên Zalo + SĐT + 4 Ảnh cá nhân** + checkbox *"Đã xác minh danh tính"*) đối với ứng viên `PENDING_APPROVAL` *(cảnh báo trùng khung giờ + buffer 60 phút tạm hoãn theo yêu cầu)*
- [x] Admin: Server Action duyệt / hạ duyệt / đôn dự bị (`requireAdmin()`) dùng chung `withLockedShow(showId)` (`SELECT ... FROM shows WHERE id = $1 FOR UPDATE`) → đếm `APPROVED` theo giới tính → cập nhật trạng thái (`reviewedBy`, `reviewedAt`), nâng `PENDING_APPROVAL -> ACTIVE` khi đã tick xác minh (`verifiedBy`, `verifiedAt`), tự đóng/mở show (bảo vệ `WAITLIST`) và ghi `audit_logs`
- [x] Admin: Tự động đếm `Nam: x/y • Nữ: x/y`, Bảng thống kê Size áo dài (`S, M, L, XL, XXL, 3XL`) tách riêng Nam/Nữ, hiển thị ảnh qua `/api/photos/[staffId]`
- [x] Staff: Mục "Lịch của tôi" với nút Xác nhận đi show (Confirm 1 chạm) & nút Vào group Zalo show (chỉ hiện khi `APPROVED`)
- [x] Admin: Bộ lọc "Chưa Confirm" & nút Xuất danh sách đã duyệt (text format kèm tổng hợp Size áo) dán vào group Zalo show

## Phase 4: Kiểm thử Toàn diện & Deploy Render Starter (Singapore)
- [ ] Kiểm thử Desktop & Mobile (375px), kiểm thử gọi trái phép mọi Server Action / DAL / `/api/photos/[staffId]`
- [ ] Kiểm thử concurrency trên cả 5 đường làm đổi slot, kiểm thử hủy khi có/không có `WAITLIST`, cảnh báo trùng lịch + buffer 60 phút, rate limit 2 tầng, `audit_logs`, và phục hồi `pg.Pool` khi Neon wake-up
- [ ] Deploy Staging & Production lên **Render Starter (\$7/tháng, Region Singapore)** nối **Neon (Region Singapore)**, đo mức dùng RAM 512 MB, gắn **domain thật HTTPS**, **xác minh lại domain & Callback URL trên `developers.zalo.me`**
- [ ] Cấu hình **Neon Launch** cho Production (bật backup hằng ngày, history window ≥ 7 ngày, cảnh báo chi phí)

## Phase 5: Vận hành Chuyên sâu (Post-MVP / Giai đoạn 2)
- [ ] Gán Team Leader & Điểm danh (Check-in / đánh dấu `NO_SHOW` đi qua `withLockedShow`) ngày diễn ra show
- [ ] Theo dõi phát/trả áo dài (`aoDaiStatus`)
- [ ] Form cập nhật STK ngân hàng (mã hóa cột AES-256-GCM) & sinh mã VietQR thanh toán lương + đánh dấu `PAID`
- [ ] Chấm điểm uy tín (`reputationScore`) & tự động duyệt nhân sự `isTrusted`
- [ ] Báo cáo Doanh thu – Chi phí – Lợi nhuận theo show/tháng
