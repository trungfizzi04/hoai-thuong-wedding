import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListSkeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/server/dal/auth";

export const metadata: Metadata = {
  title: "Đăng nhập — Hoài Thương Wedding",
  description: "Đăng nhập hệ thống quản lý nhân sự bưng quả đám cưới Hoài Thương Wedding.",
};

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [auth, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (auth) {
    if (auth.user.role === "ADMIN") redirect("/admin");
    if (!auth.profile) redirect("/onboarding");
    redirect("/staff");
  }

  const nextPath = typeof params.next === "string" ? params.next : undefined;
  const errorDesc =
    typeof params.error_description === "string"
      ? params.error_description
      : typeof params.error === "string"
        ? `Đăng nhập không thành công (${params.error}).`
        : null;
  const deletedNotice = params.deleted === "1";

  return (
    <LoginForm nextPath={nextPath} initialError={errorDesc} deletedNotice={deletedNotice} />
  );
}

export default function LoginPage({
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
          <h1 className="font-serif text-3xl font-semibold text-ink">Hoài Thương Wedding</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Cổng đăng ký &amp; điều phối nhân sự bưng quả
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Đăng nhập tài khoản</CardTitle>
            <CardDescription>
              Phiên đăng nhập được giữ tự động trong 60 ngày để bạn đăng ký show 1 chạm.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ListSkeleton rows={1} />}>
              <LoginContent searchParams={searchParams} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
