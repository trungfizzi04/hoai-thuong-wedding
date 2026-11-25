import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-paper text-ink">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="font-serif text-xl font-semibold leading-none">Hoài Thương Wedding</p>
              <p className="mt-1 hidden text-[11px] uppercase tracking-widest text-ink-secondary sm:block">
                Đội ngũ bưng quả chuyên nghiệp
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blush-strong px-4 text-xs font-semibold text-ink transition-colors hover:bg-blush sm:text-sm"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 md:px-8 md:py-16">
        <section className="grid animate-fade-up items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6 text-center lg:text-left">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-secondary">
              Điều phối nhân sự bưng quả · TP. Hồ Chí Minh
            </p>

            <h1 className="font-serif text-4xl font-semibold leading-[1.1] text-ink sm:text-6xl">
              Quản lý show &amp; đăng ký bưng quả{" "}
              <span className="italic underline decoration-blush-strong decoration-2 underline-offset-8">
                một chạm
              </span>
            </h1>

            <p className="mx-auto max-w-xl text-sm leading-relaxed text-ink-secondary sm:text-base lg:mx-0">
              Tạo hồ sơ một lần duy nhất, xem minh bạch lịch show đang mở, số slot Nam/Nữ còn lại,
              mức cát-xê và tự động tổng hợp bảng size áo dài cho từng ngày cưới.
            </p>

            <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row lg:justify-start">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-blush-strong px-6 text-sm font-semibold text-ink transition-colors hover:bg-blush"
              >
                Đăng nhập / Đăng ký bằng Zalo →
              </Link>
              <Link
                href="/staff"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-line-strong bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-sage-soft"
              >
                Cổng Nhân sự
              </Link>
            </div>
          </div>

          {/* Reserved editorial hero slot: drop public/images/hero.jpg here when ready */}
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-sage-soft/50 p-6 text-center">
              <BrandMark className="mb-4 h-14 w-14 text-2xl" />
              <p className="font-serif text-2xl font-semibold text-ink">Hoài Thương Wedding</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-secondary">
                Nghi lễ chỉn chu · Đội hình đồng đều · Minh bạch cát-xê và lịch trình cho từng lễ
                cưới hỏi.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid grid-cols-1 gap-6 border-t border-line pt-12 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-ink-secondary">01</p>
            <h2 className="font-serif text-2xl font-semibold text-ink">Hồ sơ 1 lần · Tối đa 4 ảnh</h2>
            <p className="text-sm leading-relaxed text-ink-secondary">
              Lưu chiều cao, cân nặng, size áo dài và album ảnh cá nhân bảo mật; nhận show mới không
              cần gửi lại thông tin.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-ink-secondary">02</p>
            <h2 className="font-serif text-2xl font-semibold text-ink">Tự động đếm Nam / Nữ</h2>
            <p className="text-sm leading-relaxed text-ink-secondary">
              Khóa slot bằng Transaction chống vượt người, tự tổng hợp bảng size áo dài S–3XL theo
              từng show.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-ink-secondary">03</p>
            <h2 className="font-serif text-2xl font-semibold text-ink">Kết nối mượt với Zalo</h2>
            <p className="text-sm leading-relaxed text-ink-secondary">
              Đăng nhập 1 chạm bằng Zalo, thẻ xem trước Open Graph rõ ràng và xuất danh sách đã duyệt
              dán vào group show.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-5 text-center text-xs text-ink-secondary">
        © 2026 Hoài Thương Wedding · Hệ thống Quản lý Nhân sự Bưng Quả
      </footer>
    </div>
  );
}
