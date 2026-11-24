import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "htw_session";

/**
 * Next.js 16 Proxy: fast optimistic redirect for protected UI routes.
 * Security enforcement ALWAYS happens inside DAL (`requireUser` / `requireAdmin`).
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
};
