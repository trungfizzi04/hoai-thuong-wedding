import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/staff/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-[#FAF9F5] px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#C8D5B9] font-bold text-[#3E4A42]">
            HT
          </div>
          <h1 className="text-2xl font-extrabold text-[#3E4A42]">Tạo hồ sơ nhân sự</h1>
          <p className="mt-1 text-sm text-[#4A4242]">
            Chỉ điền 1 lần duy nhất — từ lần sau bấm đăng ký show 1 chạm!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>6 thông tin tối thiểu</CardTitle>
            <CardDescription>
              Bạn có thể bổ sung cân nặng và tối đa 4 ảnh cá nhân trong tab Hồ sơ sau.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="py-6 text-center text-sm text-[#4A4242]">Đang tải biểu mẫu...</div>
              }
            >
              <OnboardingContent />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
