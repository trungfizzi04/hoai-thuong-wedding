import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ZaloSpikePanel } from "@/components/zalo-spike-panel";

export const metadata: Metadata = {
  title: "Kiểm thử Zalo Login — Hoài Thương Wedding",
  description:
    "Trang kiểm thử Phase 0A cho luồng đăng nhập Zalo OAuth v4 + PKCE, giữ phiên cookie trong Zalo WebView và thẻ xem trước Open Graph.",
  openGraph: {
    title: "Hoài Thương Wedding — Đăng ký Show Bưng Quả (Test Zalo)",
    description:
      "Thử nghiệm đăng nhập một chạm bằng Zalo trên điện thoại và kiểm tra thẻ xem trước trong nhóm chat.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function ZaloSpikePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="min-h-screen bg-[#FAF9F5] px-4 py-6 text-[#3E4A42] sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-center justify-between border-b border-[#C8D5B9] pb-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8D5B9] text-sm font-bold text-[#3E4A42] shadow-sm">
              HT
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight sm:text-lg">Hoài Thương Wedding</h1>
              <p className="text-xs text-[#4A4242]">Phase 0A · Spike Zalo Login (OAuth v4 + PKCE)</p>
            </div>
          </Link>
          <span className="rounded-full border border-[#B7C9B5] bg-[#EEF3E8] px-3 py-1 text-xs font-medium text-[#3E4A42]">
            Render Free
          </span>
        </header>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#C8D5B9] bg-white p-6 text-sm text-[#4A4242]">
              Đang tải trạng thái phiên Zalo...
            </div>
          }
        >
          <ZaloSpikePanel searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
