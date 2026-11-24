import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ShowForm } from "@/components/admin/show-form";
import { getCurrentUser } from "@/server/dal/auth";

async function NewShowGuard() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/admin/login?next=/admin/shows/new");
  if (auth.user.role !== "ADMIN" || auth.user.status !== "ACTIVE") {
    redirect("/staff");
  }
  return <ShowForm />;
}

export default function NewShowPage() {
  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3E4A42]">Tạo Show Bưng Quả Mới</h1>
          <p className="mt-1 text-sm text-[#4A4242]">
            Sau khi tạo, bạn có thể bấm Copy tin tuyển kèm link đăng ký 1 chạm để gửi vào group
            Zalo.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#C8D5B9] bg-white p-6 text-sm text-[#4A4242]">
              Đang tải biểu mẫu...
            </div>
          }
        >
          <NewShowGuard />
        </Suspense>
      </div>
    </AdminShell>
  );
}
