import { Suspense } from "react";
import { and, eq, gt, isNull } from "drizzle-orm";
import Link from "next/link";
import { InviteActivateForm } from "@/components/auth/invite-activate-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hashSessionToken } from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { inviteTokens, users } from "@/server/db/schema";

async function InviteVerifier({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const tokenHash = hashSessionToken(token);
  const now = new Date();

  const [row] = await db
    .select({
      inviteId: inviteTokens.id,
      userName: users.zaloName,
      loginPhone: users.loginPhone,
    })
    .from(inviteTokens)
    .innerJoin(users, eq(inviteTokens.userId, users.id))
    .where(
      and(
        eq(inviteTokens.tokenHash, tokenHash),
        isNull(inviteTokens.usedAt),
        gt(inviteTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-xl border border-[#E8B4B8] bg-[#F4D6D6]/50 p-4 text-sm text-[#4A4242]">
          Link kích hoạt này không hợp lệ, đã được sử dụng hoặc đã hết hạn sau 72 giờ.
        </div>
        <p className="text-xs text-[#4A4242]">
          Bạn vui lòng nhắn trực tiếp Admin trên Zalo để nhận link mới hoặc{" "}
          <Link href="/login" className="font-semibold text-[#3E4A42] underline">
            đăng nhập trực tiếp
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <InviteActivateForm
      token={token}
      invitedName={row.userName || "bạn"}
      invitedPhone={row.loginPhone}
    />
  );
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F5] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#C8D5B9] text-lg font-bold text-[#3E4A42]">
            HT
          </div>
          <h1 className="text-2xl font-extrabold text-[#3E4A42]">Kích hoạt tài khoản</h1>
          <p className="mt-1 text-sm text-[#4A4242]">Link mời riêng dùng 1 lần từ Hoài Thương Wedding</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Xác nhận danh tính</CardTitle>
            <CardDescription>
              Liên kết Zalo hoặc đặt mật khẩu để kích hoạt tài khoản nhân sự chính thức.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="py-6 text-center text-sm text-[#4A4242]">
                  Đang kiểm tra mã kích hoạt...
                </div>
              }
            >
              <InviteVerifier params={params} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
