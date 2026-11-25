"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAdminAction } from "@/server/actions/auth";

export function AdminLoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await loginAdminAction({ username, password, nextPath });
      if (!result.ok) {
        setError(result.error || "Đăng nhập Quản trị thất bại.");
        return;
      }
      router.push(result.redirectTo || "/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-blush-strong bg-blush/60 p-3.5 text-sm text-ink-secondary"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="admin-username">Tên đăng nhập (Username)</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-ink-secondary/60" />
          <Input
            id="admin-username"
            type="text"
            autoComplete="username"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-password">Mật khẩu Quản trị</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-ink-secondary/60" />
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            placeholder="Nhập mật khẩu quản trị"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Đang đăng nhập..." : "Đăng nhập Quản trị"}
      </Button>

      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="text-xs font-medium text-ink-secondary/80 underline underline-offset-4 hover:text-ink"
        >
          ← Quay lại cổng đăng nhập Nhân sự (Zalo)
        </Link>
      </div>
    </form>
  );
}
