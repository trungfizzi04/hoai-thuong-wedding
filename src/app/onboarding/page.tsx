import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { OnboardingForm } from "@/components/staff/onboarding-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListSkeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/server/dal/auth";

async function OnboardingContent() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role === "ADMIN") redirect("/admin");
  if (auth.profile) redirect("/staff");

  return (
    <OnboardingForm
      defaultFullName={auth.user.zaloName ?? ""}
      defaultPhone={auth.user.loginPhone ?? ""}
    />
  );
}

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen bg-paper px-4 py-8 sm:py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-lg space-y-5">
        <div className="flex flex-col items-center text-center">
          <BrandMark className="mb-3 h-12 w-12 text-xl" />
          <h1 className="font-serif text-3xl font-semibold text-ink">Tạo hồ sơ nhân sự</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Chỉ điền 1 lần duy nhất — từ lần sau bấm đăng ký show 1 chạm!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>6 thông tin tối thiểu</CardTitle>
            <CardDescription>
              Bạn có thể chọn ngay tối đa 4 ảnh cá nhân và bổ sung cân nặng trong tab Hồ sơ sau.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ListSkeleton rows={1} />}>
              <OnboardingContent />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
