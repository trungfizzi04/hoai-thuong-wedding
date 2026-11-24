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

  if (!appId) {
    const spikeUrl = new URL("/zalo-spike", origin);
    spikeUrl.searchParams.set("error", "MISSING_ZALO_APP_ID");
    spikeUrl.searchParams.set(
      "error_description",
      "Chưa cấu hình biến môi trường ZALO_APP_ID trên server.",
    );
    return NextResponse.redirect(spikeUrl);
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

  response.cookies.set("zalo_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  response.cookies.set("zalo_state", state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
