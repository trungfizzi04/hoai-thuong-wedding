import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui/skeleton";
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
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">Tạo Show Bưng Quả Mới</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Sau khi tạo, bạn có thể bấm Copy tin tuyển kèm link đăng ký 1 chạm để gửi vào group
            Zalo.
          </p>
        </div>
        <Suspense fallback={<ListSkeleton rows={2} />}>
          <NewShowGuard />
        </Suspense>
      </div>
    </AdminShell>
  );
}
