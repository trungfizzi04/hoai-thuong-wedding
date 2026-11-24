import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "htw_session";

/**
 * Next.js 16 Proxy: fast optimistic redirect for protected UI routes.
 * Security enforcement ALWAYS happens inside DAL (`requireUser` / `requireAdmin`).
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public admin login page must remain accessible without session cookie
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!hasSessionCookie) {
    const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
};
