import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListSkeleton } from "@/components/ui/skeleton";
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-3">
            <BrandMark className="h-12 w-12 text-xl" />
          </Link>
          <h1 className="font-serif text-3xl font-semibold text-ink">Cổng Quản trị (Admin)</h1>
          <p className="mt-1 text-sm text-ink-secondary">Hoài Thương Wedding — Quản lý Show &amp; Nhân sự</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Đăng nhập Quản trị viên</CardTitle>
            <CardDescription>
              Tài khoản quản trị tách biệt hoàn toàn với tài khoản Zalo nhân sự.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ListSkeleton rows={1} />}>
              <AdminLoginContent searchParams={searchParams} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
