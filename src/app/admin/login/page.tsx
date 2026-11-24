import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/server/dal/auth";

export const metadata: Metadata = {
  title: "Đăng nhập Quản trị — Hoài Thương Wedding",
};

async function AdminLoginContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [auth, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (auth && auth.user.role === "ADMIN" && auth.user.status === "ACTIVE") {
    redirect("/admin");
  }

  const nextPath = typeof params.next === "string" ? params.next : undefined;
  return <AdminLoginForm nextPath={nextPath} />;
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F5] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link
            href="/"
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#C8D5B9] text-lg font-bold text-[#3E4A42] shadow-sm"
          >
            HT
          </Link>
          <h1 className="text-2xl font-extrabold text-[#3E4A42]">Cổng Quản trị (Admin)</h1>
          <p className="mt-1 text-sm text-[#4A4242]">Hoài Thương Wedding — Quản lý Show &amp; Nhân sự</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Đăng nhập Quản trị viên</CardTitle>
            <CardDescription>
              Tài khoản quản trị tách biệt hoàn toàn với tài khoản Zalo nhân sự.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="py-6 text-center text-sm text-[#4A4242]">Đang tải...</div>
              }
            >
              <AdminLoginContent searchParams={searchParams} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
