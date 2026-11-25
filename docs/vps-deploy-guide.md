# Hướng dẫn Deploy & Vận hành VPS — Hoài Thương Wedding

> **Thông tin hạ tầng (không lưu mật khẩu/secret trong file này)**
> - **VPS**: Ubuntu 24.04 LTS — IP `160.187.229.48`
> - **Thư mục source trên VPS**: `/var/www/hoai-thuong-wedding`
> - **Process Manager**: PM2 — tên app: `hoai-thuong-wedding`
> - **Reverse Proxy / HTTPS**: Caddy (`https://160-187-229-48.sslip.io`)
> - **GitHub Repo**: `https://github.com/trungfizzi04/hoai-thuong-wedding` (nhánh `main`)

---

## 1. Quy trình Deploy Chuẩn (Mỗi khi có code mới)

### Bước 1 — Trên máy tính cá nhân (Local)
```bash
git status
git add -A
git commit -m "feat: mô tả ngắn gọn thay đổi"
git push origin main
```

### Bước 2 — Trên VPS (SSH vào rồi dán 1 trong 3 lệnh bên dưới)
Đăng nhập VPS:
```bash
ssh root@160.187.229.48
```

#### A. Cập nhật NHANH *(khi chỉ sửa code UI/API, không đổi `package.json` hay DB)*
```bash
cd /var/www/hoai-thuong-wedding && git pull && pnpm build && pm2 restart hoai-thuong-wedding
```

#### B. Cập nhật KÈM CÀI THƯ VIỆN *(khi có sửa `package.json` / `pnpm-lock.yaml`)*
```bash
cd /var/www/hoai-thuong-wedding && git pull && pnpm install --frozen-lockfile && pnpm build && pm2 restart hoai-thuong-wedding
```

#### C. Cập nhật KÈM MIGRATION DATABASE *(khi có file mới trong thư mục `drizzle/`)*
```bash
cd /var/www/hoai-thuong-wedding && git pull && pnpm install --frozen-lockfile && pnpm db:migrate && pnpm build && pm2 restart hoai-thuong-wedding
```

---

## 2. Kiểm tra sau khi Deploy (Health Check & Logs)

### Kiểm tra web đã lên lại chưa
```bash
curl -sS https://160-187-229-48.sslip.io/api/health
```

### Xem trạng thái & log ứng dụng (PM2)
```bash
pm2 status
pm2 logs hoai-thuong-wedding --lines 50
```
*(Bấm `Ctrl + C` để thoát chế độ xem log realtime).*

### Xem log HTTPS / Reverse Proxy (Caddy)
```bash
journalctl -u caddy -n 30 --no-pager
```

---

## 3. Xử lý Sự cố & Rollback Nhanh

### Rollback về phiên bản ổn định trước đó
1. Xem 5 commit gần nhất để lấy mã commit cũ (ví dụ `3060ccd`):
   ```bash
   cd /var/www/hoai-thuong-wedding && git log -n 5 --oneline
   ```
2. Quay về commit cũ và build lại:
   ```bash
   cd /var/www/hoai-thuong-wedding && git checkout <MA_COMMIT_CU> && pnpm build && pm2 restart hoai-thuong-wedding
   ```
3. Khi đã sửa xong và muốn quay lại nhánh `main` mới nhất:
   ```bash
   cd /var/www/hoai-thuong-wedding && git checkout main && git pull && pnpm build && pm2 restart hoai-thuong-wedding
   ```

### Kiểm tra RAM & Swap khi `pnpm build` bị chậm hoặc out-of-memory (VPS 2GB RAM)
```bash
free -h
```

### Khởi động lại Caddy (sau khi sửa `/etc/caddy/Caddyfile`, ví dụ khi gắn tên miền riêng)
```bash
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
```
