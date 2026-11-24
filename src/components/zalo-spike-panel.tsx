import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import type { ZaloSpikeSession } from "@/lib/zalo";

interface ZaloSpikePanelProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseSessionCookie(raw: string | undefined): ZaloSpikeSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ZaloSpikeSession>;
    if (!parsed || typeof parsed.id !== "string") return null;
    return {
      id: parsed.id,
      name: typeof parsed.name === "string" ? parsed.name : "(Không có tên)",
      pictureUrl: typeof parsed.pictureUrl === "string" ? parsed.pictureUrl : null,
      isSensitive: typeof parsed.isSensitive === "boolean" ? parsed.isSensitive : null,
      rawProfile: parsed.rawProfile ?? { error: 0, message: "Success", id: parsed.id },
      authenticatedAt:
        typeof parsed.authenticatedAt === "string" ? parsed.authenticatedAt : "",
    };
  } catch {
    return null;
  }
}

export async function ZaloSpikePanel({ searchParams }: ZaloSpikePanelProps) {
  const [cookieStore, resolvedParams] = await Promise.all([cookies(), searchParams]);
  const session = parseSessionCookie(cookieStore.get("zalo_spike_user")?.value);

  const errorCode =
    typeof resolvedParams.error === "string" ? resolvedParams.error : null;
  const errorDescription =
    typeof resolvedParams.error_description === "string"
      ? resolvedParams.error_description
      : null;
  const justLoggedIn = resolvedParams.success === "1";

  const appId = process.env.ZALO_APP_ID?.trim() || null;
  const hasSecret = Boolean(process.env.ZALO_APP_SECRET?.trim());
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
    "Chưa cấu hình (sẽ dùng domain hiện tại)";
  const callbackUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
    ? `${process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, "")}/api/auth/zalo/callback`
    : "/api/auth/zalo/callback";
  const verifyCode = process.env.NEXT_PUBLIC_ZALO_VERIFY_CODE?.trim() || null;

  return (
    <div className="space-y-6">
      {errorCode ? (
        <div
          role="alert"
          className="rounded-2xl border border-[#E8B4B8] bg-[#F4D6D6]/50 p-4 text-sm text-[#4A4242]"
        >
          <p className="font-semibold text-[#3E4A42]">Đăng nhập Zalo thất bại: {errorCode}</p>
          {errorDescription ? <p className="mt-1">{errorDescription}</p> : null}
        </div>
      ) : null}

      {justLoggedIn && session ? (
        <div className="rounded-2xl border border-[#B7C9B5] bg-[#EEF3E8] p-4 text-sm text-[#3E4A42]">
          <p className="font-semibold">Đăng nhập Zalo thành công!</p>
          <p className="mt-1 text-[#4A4242]">
            Hãy thử <strong>tắt hẳn app Zalo</strong> rồi bấm lại link này trong group để kiểm tra
            xem phiên cookie <code>HttpOnly</code> có còn được giữ nguyên không.
          </p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-[#C8D5B9] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#3E4A42]">
          1. Kiểm thử Đăng nhập bằng Zalo (OAuth v4 + PKCE)
        </h2>
        <p className="mt-1 text-sm text-[#4A4242]">
          Xác thực phía server bằng <code>code_verifier</code> (43 ký tự) + <code>secret_key</code>{" "}
          và lấy thông tin từ <code>graph.zalo.me/v2.0/me</code>.
        </p>

        {session ? (
          <div className="mt-5 space-y-4">
            <div className="flex flex-col gap-4 rounded-xl bg-[#EEF3E8] p-4 sm:flex-row sm:items-center">
              {session.pictureUrl ? (
                <Image
                  src={session.pictureUrl}
                  alt={session.name}
                  width={68}
                  height={68}
                  unoptimized
                  className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C8D5B9] text-lg font-bold text-[#3E4A42]">
                  {session.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-base font-bold text-[#3E4A42]">{session.name}</p>
                <p className="truncate text-xs text-[#4A4242]">
                  Zalo ID: <code className="rounded bg-white px-1.5 py-0.5">{session.id}</code>
                </p>
                <p className="text-xs text-[#4A4242]">
                  Thời điểm lưu cookie:{" "}
                  <code className="rounded bg-white px-1.5 py-0.5">
                    {session.authenticatedAt || "N/A"}
                  </code>
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4A4242]">
                Payload trả về từ /v2.0/me
              </p>
              <pre className="overflow-x-auto rounded-xl bg-[#3E4A42] p-4 text-xs text-[#FAF9F5]">
                {JSON.stringify(session.rawProfile, null, 2)}
              </pre>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/api/auth/zalo?mode=spike"
                className="inline-flex items-center justify-center rounded-xl bg-[#E8B4B8] px-4 py-2.5 text-sm font-semibold text-[#3E4A42] transition-colors hover:bg-[#F4D6D6]"
              >
                Đăng nhập lại bằng Zalo
              </a>
              <a
                href="/api/auth/zalo/logout"
                className="inline-flex items-center justify-center rounded-xl border border-[#B7C9B5] bg-white px-4 py-2.5 text-sm font-semibold text-[#3E4A42] transition-colors hover:bg-[#EEF3E8]"
              >
                Xóa phiên cookie (Đăng xuất)
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <a
              href="/api/auth/zalo?mode=spike"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#E8B4B8] px-5 py-3 text-sm font-semibold text-[#3E4A42] shadow-sm transition-colors hover:bg-[#F4D6D6] sm:w-auto"
            >
              Đăng nhập bằng Zalo
            </a>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#C8D5B9] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#3E4A42]">
          2. Trạng thái Cấu hình Môi trường (Render / Local)
        </h2>
        <dl className="mt-4 divide-y divide-[#C8D5B9]/40 text-sm">
          <div className="flex flex-col justify-between gap-1 py-2.5 sm:flex-row">
            <dt className="font-medium text-[#4A4242]">NEXT_PUBLIC_APP_URL</dt>
            <dd className="break-all font-mono text-xs text-[#3E4A42]">{appUrl}</dd>
          </div>
          <div className="flex flex-col justify-between gap-1 py-2.5 sm:flex-row">
            <dt className="font-medium text-[#4A4242]">Callback URL</dt>
            <dd className="break-all font-mono text-xs text-[#3E4A42]">{callbackUrl}</dd>
          </div>
          <div className="flex flex-col justify-between gap-1 py-2.5 sm:flex-row">
            <dt className="font-medium text-[#4A4242]">ZALO_APP_ID</dt>
            <dd className="font-mono text-xs">
              {appId ? (
                <span className="rounded-full bg-[#EEF3E8] px-2.5 py-0.5 text-[#3E4A42]">
                  Đã cấu hình ({appId})
                </span>
              ) : (
                <span className="rounded-full bg-[#F4D6D6] px-2.5 py-0.5 text-[#4A4242]">
                  Chưa cấu hình
                </span>
              )}
            </dd>
          </div>
          <div className="flex flex-col justify-between gap-1 py-2.5 sm:flex-row">
            <dt className="font-medium text-[#4A4242]">ZALO_APP_SECRET</dt>
            <dd className="font-mono text-xs">
              {hasSecret ? (
                <span className="rounded-full bg-[#EEF3E8] px-2.5 py-0.5 text-[#3E4A42]">
                  Đã cấu hình (ẩn)
                </span>
              ) : (
                <span className="rounded-full bg-[#F4D6D6] px-2.5 py-0.5 text-[#4A4242]">
                  Chưa cấu hình
                </span>
              )}
            </dd>
          </div>
          <div className="flex flex-col justify-between gap-1 py-2.5 sm:flex-row">
            <dt className="font-medium text-[#4A4242]">NEXT_PUBLIC_ZALO_VERIFY_CODE</dt>
            <dd className="font-mono text-xs">
              {verifyCode ? (
                <span className="rounded-full bg-[#EEF3E8] px-2.5 py-0.5 text-[#3E4A42]">
                  Đã gắn thẻ meta
                </span>
              ) : (
                <span className="rounded-full bg-[#FAF9F5] px-2.5 py-0.5 text-[#4A4242]">
                  Đang dùng file HTML tĩnh trong /public
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-[#C8D5B9] bg-[#EEF3E8]/70 p-6">
        <h2 className="text-base font-semibold text-[#3E4A42]">
          3. Checklist 4 Tiêu chí Đạt / Không đạt (Test trên iPhone & Android)
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#4A4242]">
          <li>
            Tài khoản Zalo thông thường (ngoài danh sách Tester) có đăng nhập được khi app đang
            hoạt động không?
          </li>
          <li>
            Payload <code>/v2.0/me</code> có trả về đầy đủ <code>id</code>, <code>name</code>,{" "}
            <code>picture</code>?
          </li>
          <li>
            Tắt hoàn toàn app Zalo rồi mở lại link này — phiên cookie <code>HttpOnly</code> có còn
            giữ nguyên không?
          </li>
          <li>
            Khi dán link vào group Zalo, thẻ xem trước (Open Graph) có hiển thị tiêu đề và mô tả
            không?
          </li>
        </ol>
        <div className="mt-4">
          <Link
            href="/"
            className="text-sm font-medium text-[#3E4A42] underline underline-offset-4 hover:text-[#4A4242]"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </section>
    </div>
  );
}
