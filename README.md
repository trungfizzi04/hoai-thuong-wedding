# Hoài Thương Wedding — Hệ thống Quản lý Nhân sự Bưng Quả Đám Cưới

Ứng dụng web Full-stack (Next.js 16 App Router + TypeScript strict + Tailwind CSS) phục vụ điều phối, tuyển dụng và quản lý đội ngũ nhân sự bưng quả đám cưới.

## 1. Chạy thử trên máy cá nhân (Local)

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Mở trình duyệt tại `http://localhost:3000` (hoặc `http://localhost:3000/zalo-spike` để xem trang kiểm thử Zalo Login).

### Các lệnh kiểm tra chất lượng code

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## 2. Deploy miễn phí 0đ qua GitHub → Render (Region Singapore)

1. Push toàn bộ dự án lên một repository GitHub (khuyến nghị `main`).
2. Đăng nhập [Render](https://dashboard.render.com/) → chọn **New +** → **Blueprint** (hoặc **Web Service**) và kết nối repository GitHub của bạn.
   - Nếu chọn **Blueprint**, Render tự đọc cấu hình trong `render.yaml` (`region: singapore`, `plan: free`, `healthCheckPath: /api/health`).
3. Trong mục **Environment Variables** trên Render, khai báo 4 biến:
   - `NEXT_PUBLIC_APP_URL` = `https://hoai-thuong-wedding.onrender.com` *(đúng URL Render cấp, không có dấu `/` ở cuối)*
   - `NEXT_PUBLIC_ZALO_VERIFY_CODE` = `ODcrDE7d00CgxwCzpVuOC4__lXcZYMLFDp0o`
   - `ZALO_APP_ID` = *App ID trên `developers.zalo.me`*
   - `ZALO_APP_SECRET` = *Khóa bí mật ứng dụng trên `developers.zalo.me`*
4. Chờ deploy xong và kiểm tra:
   - `https://hoai-thuong-wedding.onrender.com/api/health` trả về `{"status":"ok",...}`
   - `https://hoai-thuong-wedding.onrender.com/zalo_verifierODcrDE7d00CgxwCzpVuOC4__lXcZYMLFDp0o.html` hiển thị thành công.

## 3. Cấu hình & Kiểm thử Phase 0A trên Zalo Developers

1. Vào `developers.zalo.me` → **Xác thực domain** → ô **Tiền tố URL** (bên phải) nhập `https://hoai-thuong-wedding.onrender.com` → bấm **Xác thực** (cả tệp HTML lẫn thẻ `<meta>` đều đã có sẵn).
2. Vào **Sản phẩm → Đăng nhập bằng Zalo → Web**:
   - Giữ bật **Kiểm tra secret key**.
   - **Home URL**: `https://hoai-thuong-wedding.onrender.com`
   - **Callback URL**: `https://hoai-thuong-wedding.onrender.com/api/auth/zalo/callback`
   - Bấm **Lưu thay đổi**.
3. Dán link `https://hoai-thuong-wedding.onrender.com/zalo-spike` vào một group Zalo và kiểm tra trên iPhone & Android theo **4 tiêu chí Go/No-Go**:
   - Người ngoài danh sách Tester có đăng nhập được không?
   - Payload `/v2.0/me` trả về đúng `id`, `name`, `picture`, `is_sensitive`?
   - Tắt hoàn toàn app Zalo rồi mở lại link có còn giữ phiên `HttpOnly` cookie không?
   - Thẻ xem trước (Open Graph) có hiển thị đúng tiêu đề/mô tả trong khung chat Zalo không?

> **Lưu ý Render Free**: Service gói Free tự ngủ sau 15 phút không có truy cập (lần mở lại đầu tiên mất ~30–50 giây). Khi bắt đầu có show thực tế cần chạy 24/7, chỉ cần chuyển sang gói **Render Starter** trên cùng service mà không phải sửa code.
