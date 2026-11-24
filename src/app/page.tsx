import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAF9F5] text-[#3E4A42]">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8D5B9] text-base font-bold text-[#3E4A42] shadow-sm">
            HT
          </div>
          <div>
            <p className="text-base font-bold leading-tight">Hoài Thương Wedding</p>
            <p className="text-xs text-[#4A4242]">Đội Ngũ Bưng Quả Đám Cưới Chuyên Nghiệp</p>
          </div>
        </div>

        <Link
          href="/login"
          className="rounded-xl bg-[#E8B4B8] px-4 py-2 text-xs font-semibold text-[#3E4A42] shadow-sm transition-colors hover:bg-[#F4D6D6] sm:text-sm"
        >
          Đăng nhập
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#B7C9B5] bg-[#EEF3E8] px-3.5 py-1 text-xs font-medium text-[#3E4A42]">
          <span className="h-2 w-2 rounded-full bg-[#3E4A42]" />
          Hệ thống Điều phối &amp; Tuyển dụng Nhân sự Bưng Quả
        </span>

        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-[#3E4A42] sm:text-5xl">
          Quản lý Show &amp; Đăng ký Bưng Quả{" "}
          <span className="rounded-lg bg-[#C8D5B9]/60 px-2 py-0.5">Một Chạm</span>
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#4A4242] sm:text-base">
          Tạo hồ sơ một lần duy nhất, xem minh bạch lịch show đang mở, số slot Nam/Nữ còn lại,
          mức cát-xê và tự động tổng hợp bảng size áo dài cho từng ngày cưới.
        </p>

        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-[#E8B4B8] px-6 py-3 text-sm font-semibold text-[#3E4A42] shadow-sm transition-colors hover:bg-[#F4D6D6]"
          >
            Đăng nhập / Đăng ký bằng Zalo →
          </Link>
          <Link
            href="/staff"
            className="inline-flex items-center justify-center rounded-xl border border-[#B7C9B5] bg-white px-6 py-3 text-sm font-semibold text-[#3E4A42] transition-colors hover:bg-[#EEF3E8]"
          >
            Cổng Nhân sự
          </Link>
        </div>

        <section className="mt-12 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-[#C8D5B9] bg-[#EEF3E8]/70 p-5">
            <h2 className="text-sm font-bold text-[#3E4A42]">Hồ sơ 1 lần · Tối đa 4 ảnh</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#4A4242]">
              Lưu chiều cao, cân nặng, size áo dài và album ảnh cá nhân bảo mật; nhận show mới
              không cần gửi lại thông tin.
            </p>
          </div>
          <div className="rounded-2xl border border-[#C8D5B9] bg-[#EEF3E8]/70 p-5">
            <h2 className="text-sm font-bold text-[#3E4A42]">Tự động đếm Nam / Nữ</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#4A4242]">
              Khóa slot bằng Transaction chống vượt người, tự tổng hợp bảng size áo dài S–3XL theo
              từng show.
            </p>
          </div>
          <div className="rounded-2xl border border-[#C8D5B9] bg-[#EEF3E8]/70 p-5">
            <h2 className="text-sm font-bold text-[#3E4A42]">Kết nối mượt với Zalo</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#4A4242]">
              Đăng nhập 1 chạm bằng Zalo, thẻ xem trước Open Graph rõ ràng và xuất danh sách đã
              duyệt dán vào group show.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#C8D5B9]/60 py-4 text-center text-xs text-[#4A4242]">
        © 2026 Hoài Thương Wedding · Hệ thống Quản lý Nhân sự Bưng Quả
      </footer>
    </div>
  );
}
