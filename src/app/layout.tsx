import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
const zaloVerifyCode = process.env.NEXT_PUBLIC_ZALO_VERIFY_CODE?.trim();

export const metadata: Metadata = {
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  title: "Hoài Thương Wedding — Quản lý Nhân sự Bưng Quả Đám Cưới",
  description:
    "Hệ thống đăng ký show bưng quả một chạm, minh bạch lịch trình, cát-xê và tự động tổng hợp đội hình Nam/Nữ & size áo dài.",
  openGraph: {
    title: "Hoài Thương Wedding — Đăng ký Show Bưng Quả Một Chạm",
    description:
      "Xem lịch show đang mở tuyển, số slot Nam/Nữ còn lại, mức cát-xê và đăng ký nhận show ngay trên điện thoại.",
    type: "website",
    locale: "vi_VN",
    siteName: "Hoài Thương Wedding",
  },
  other: zaloVerifyCode
    ? {
        "zalo-platform-site-verification": zaloVerifyCode,
      }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/** Runs before first paint: Light by default, Dark only when the user explicitly chose it. */
const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("htw-theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${cormorant.variable} ${beVietnam.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {zaloVerifyCode ? (
          <meta property="zalo-platform-site-verification" content={zaloVerifyCode} />
        ) : null}
      </head>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
