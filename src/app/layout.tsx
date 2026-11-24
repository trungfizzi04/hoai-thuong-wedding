import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {zaloVerifyCode ? (
          <meta property="zalo-platform-site-verification" content={zaloVerifyCode} />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-[#FAF9F5] text-[#3E4A42]">
        {children}
      </body>
    </html>
  );
}
