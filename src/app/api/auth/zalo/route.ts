import { NextRequest, NextResponse } from "next/server";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
  getZaloAuthUrl,
  resolveAppOrigin,
} from "@/lib/zalo";

export async function GET(request: NextRequest) {
  const origin = resolveAppOrigin(request);
  const appId = process.env.ZALO_APP_ID?.trim();
  const invite = request.nextUrl.searchParams.get("invite")?.trim() || null;
  const nextPath = request.nextUrl.searchParams.get("next")?.trim() || null;

  if (!appId) {
    const errorTarget = new URL("/login", origin);
    errorTarget.searchParams.set("error", "MISSING_ZALO_APP_ID");
    errorTarget.searchParams.set(
      "error_description",
      "Chưa cấu hình biến môi trường ZALO_APP_ID trên server.",
    );
    return NextResponse.redirect(errorTarget);
  }

  const redirectUri = `${origin}/api/auth/zalo/callback`;
  const codeVerifier = generateCodeVerifier(43);
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateOAuthState();

  const authUrl = getZaloAuthUrl({
    appId,
    redirectUri,
    codeChallenge,
    state,
  });

  const response = NextResponse.redirect(authUrl);
  const isSecure = origin.startsWith("https://");
  const baseCookie = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };

  response.cookies.set("zalo_code_verifier", codeVerifier, baseCookie);
  response.cookies.set("zalo_state", state, baseCookie);

  response.cookies.delete("zalo_auth_mode");

  if (invite) {
    response.cookies.set("zalo_invite_token", invite, baseCookie);
  } else {
    response.cookies.delete("zalo_invite_token");
  }

  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    response.cookies.set("zalo_auth_next", nextPath, baseCookie);
  } else {
    response.cookies.delete("zalo_auth_next");
  }

  return response;
}
