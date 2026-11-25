# Kế hoạch Tối ưu Toàn diện: Editorial UI/UX (Sáng/Tối, Mobile + Desktop), Vietnam Provinces API (Trước & Sau Sáp Nhập) & Tối ưu Tính năng

> **Hoài Thương Wedding — Đợt nâng cấp toàn diện sau MVP (Phase 0A → Phase 3)**:
> 1. **Editorial Wedding Aesthetic + Chế độ Sáng / Tối (Dark Mode)** với bảng màu rêu than trầm ấm (`#141916` / `#1C231F` / `#F3EFE7`), cặp font tiếng Việt `Cormorant Garamond` + `Be Vietnam Pro`, tối ưu riêng cho **Mobile (`375px` Zalo WebView)** và **Desktop (`1280px+`)**.
> 2. **Tích hợp Vietnam Provinces Online API (`provinces.open-api.vn`)** hỗ trợ song song cả **Sau sáp nhập 2025 (2 cấp: Tỉnh/TP → Phường/Xã)** và **Trước sáp nhập (3 cấp: Tỉnh/TP → Quận/Huyện → Phường/Xã)** kèm **quy đổi 1 chạm** (`/w/from-legacy/`).
> 3. **Custom Popup Modal** (thay toàn bộ `window.confirm` / `window.prompt`), **Toast**, **Skeleton shimmer** và **micro-animations 60fps bằng CSS/Tailwind** *(không dùng Three.js/GSAP để giữ tốc độ tải 4G tức thì trong Zalo WebView)*.

---

## 1. Hệ thống Thiết kế Editorial & Dark Mode (`src/app/layout.tsx`, `src/app/globals.css`)

### A. Typography tiếng Việt sang trọng
- **Tiêu đề (`--font-serif`)**: **`Cormorant Garamond`** (`500, 600, 700`, `vietnamese`).
- **Nội dung & Số liệu (`--font-sans`)**: **`Be Vietnam Pro`** (`400, 500, 600, 700`, `vietnamese`, `tabular-nums`).

### B. Hệ biến màu Sáng / Tối (`@custom-variant dark`)
| Token | Light Mode (Editorial Paper) | Dark Mode (Warm Forest Charcoal) |
| :--- | :--- | :--- |
| `--bg-paper` | `#FAF8F4` | `#141916` |
| `--bg-surface` | `#FFFFFF` | `#1C231F` |
| `--bg-subtle` | `#F1F4EC` | `#242D28` |
| `--border-hairline` | `#E3E6DC` | `#2E3A33` |
| `--ink-primary` | `#3E4A42` | `#F3EFE7` |
| `--ink-secondary` | `#5E5755` | `#B5BEB6` |
| `--accent-sage` | `#C8D5B9` / `#B7C9B5` | `#8FA882` / `#6F8763` |
| `--accent-blush` | `#E8B4B8` / `#F4D6D6` | `#D99AA0` / `#E8B4B8` |

- Tạo `src/components/theme/theme-toggle.tsx` + inline theme init script trong `layout.tsx` để giữ lựa chọn Sáng/Tối trong `localStorage` mà không nhấp nháy (FOUC) khi tải trang.

### C. Bộ Micro-interactions, Popup Modal, Toast & Skeleton (`src/components/ui/`)
- **`toast.tsx`**: `ToastProvider` + `useToast()` trượt êm, tự đóng sau 3.5 giây.
- **`modal.tsx`**: Custom Editorial Popup Modal (nền mờ `backdrop-blur`, animation zoom-fade, đóng bằng ESC/click ngoài) thay thế hoàn toàn `window.confirm` (xóa tài khoản) và `window.prompt` (nhập lý do hủy show).
- **`skeleton.tsx`**: Khung xương shimmer mượt cho mọi `<Suspense fallback>`.
- **Animations 60fps (`globals.css`)**: `@keyframes fadeUp`, `modalIn`, `toastIn`, `shimmer` tôn trọng `prefers-reduced-motion`.

---

## 2. Tích hợp Vietnam Provinces Online API — Hỗ trợ Cả Trước & Sau Sáp Nhập (2025)

Vì thực tế khách hàng (cô dâu/chú rể) vẫn có người đọc địa chỉ theo kiểu **cũ (3 cấp)** và người dùng địa chỉ **mới (2 cấp sau sáp nhập 2025)**, component **`LocationPicker`** sẽ tích hợp song song cả 2 bản của `provinces.open-api.vn` qua proxy nội bộ (cache 24h `revalidate: 86400` + fallback tĩnh):

- **4 route proxy nội bộ gọn nhẹ**:
  1. `GET /api/locations/provinces?mode=v2|v1` → `provinces.open-api.vn/api/{mode}/p/`
  2. `GET /api/locations/districts?province={code}` *(chế độ Trước sáp nhập `v1`)* → `/api/v1/p/{code}?depth=2`
  3. `GET /api/locations/wards?mode=v2&province={code}` *(Sau sáp nhập)* hoặc `?mode=v1&district={code}` *(Trước sáp nhập)*
  4. `GET /api/locations/convert?legacyCode={wardCode}` → gọi `/api/v2/w/from-legacy/?legacy_code={wardCode}` để **quy đổi 1 chạm** từ phường/xã cũ sang địa chỉ mới sau sáp nhập.
- **Trải nghiệm trên Form Tạo/Sửa Show (`src/components/ui/location-picker.tsx`)**:
  - Thanh chuyển nhanh **`Sau sáp nhập (2 cấp)` | `Trước sáp nhập (3 cấp)`** (mặc định *Sau sáp nhập*) + tùy chọn *"Tự nhập tay"*.
  - **Sau sáp nhập (2 cấp)**: Chọn `Tỉnh/TP` → `Phường/Xã` → tự ghép chuẩn `"Phường X, Tỉnh/TP Y"`.
  - **Trước sáp nhập (3 cấp)**: Chọn `Tỉnh/TP` → `Quận/Huyện` → `Phường/Xã` → tự ghép chuẩn `"Phường X, Quận/Huyện Y, Tỉnh/TP Z"`, kèm nút **"Quy đổi sang địa chỉ mới (2025)"**.

---

## 3. Tối ưu Tính năng & Responsive (Mobile 375px + Desktop 1280px+)

### A. Form Tạo / Sửa Show (`src/lib/constants/show-presets.ts`, `src/components/admin/show-form.tsx`)
- **Chọn nhanh Ca giờ**: 1 ô **Ngày** + 4 chip ca cưới (*Sáng sớm `06:00–10:00`*, *Sáng `06:30–10:30`*, *Sáng `07:00–11:00`*, *Chiều `13:30–17:30`*) + chỉnh giờ tay.
- **Chọn nhanh Đội hình / Số tráp**: Chip số tráp (`5`, `6`, `7`, `9`) + chọn bên (`Nhà trai / Nhà gái / Cả 2 bên`) → tự điền Slot Nam/Nữ.
- **`LocationPicker`**: Chọn địa chỉ Trước/Sau sáp nhập từ **Vietnam Provinces API**.
- **Chip Cát-xê nhanh** (`250k`, `300k`, `350k`, `400k`, `500k`) + **Chip Phụ cấp toggle** (*Bao ăn sáng*, *Nước suối*, *Xăng xe 30k*, *Gửi xe*).
- **Dropdown Trang phục mẫu** (*Áo dài đỏ truyền thống*, *Hồng phấn pastel*, *Trắng kem*, *Xanh sage pastel*, *Khác...*).
- **Desktop 2 cột**: Form bên trái + **Live Preview tin tuyển Zalo & dự toán lợi nhuận** sticky bên phải.

### B. Upload Nhiều Ảnh (`multiple`) & Đặt làm Ảnh Chính
- **`PATCH /api/staff/photos`** (`{ primaryIndex }`): Đưa ảnh chọn lên vị trí số 1 (`photoItems[0]` & đồng bộ `primaryPhotoPublicId`).
- **`/onboarding` & `/staff/profile`**: Bấm 1 lần chọn cùng lúc **1–4 ảnh**, nén song song trên trình duyệt kèm tiến độ từng ảnh, nút **Đặt làm ảnh chính** (ngôi sao), **Thay** (tự xóa ảnh cũ trên Cloudinary), **Xóa** và **Lightbox** có nút chuyển ảnh trái/phải.

### C. Responsive Chuyên biệt Mobile & Desktop
- **Admin**: **Sidebar cố định (`w-60`)** trên Desktop + **Bottom Nav 3 tab** có active state trên Mobile; màn hình `/admin/shows/[id]` bố cục **2 cột sticky** trên Desktop + bộ lọc nhanh **Đội Nam / Đội Nữ**.
- **Staff**: Top header + lưới **2 cột** trên Desktop (`max-w-5xl`), **1 cột + Bottom Nav 3 tab** có active state trên Mobile (`375px` Zalo WebView).
- **Landing `/`, `/login`, `/admin/login`, `/shows/[id]`**: Nâng cấp toàn bộ theo Editorial Wedding Aesthetic + hỗ trợ Dark Mode đồng nhất 100%.

---

## 4. Kiểm thử & Xác minh
- Chạy `pnpm typecheck && pnpm lint && pnpm build` (0 lỗi, 0 cảnh báo).
- Kiểm thử giao diện Sáng & Tối trên Mobile (`375px`) và Desktop (`1280px+`).
- Tạo `walkthrough.md` tóm tắt toàn bộ thay đổi + hướng dẫn đẩy lên VPS Việt Nam.
