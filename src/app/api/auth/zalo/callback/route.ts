import { NextRequest, NextResponse } from "next/server";
import {
  exchangeZaloCode,
  getZaloUserInfo,
  resolveAppOrigin,
  type ZaloSpikeSession,
} from "@/lib/zalo";

function redirectWithError(origin: string, code: string, description?: string) {
  const spikeUrl = new URL("/zalo-spike", origin);
  spikeUrl.searchParams.set("error", code);
  if (description) {
    spikeUrl.searchParams.set("error_description", description);
  }
  const response = NextResponse.redirect(spikeUrl);
  response.cookies.delete("zalo_code_verifier");
  response.cookies.delete("zalo_state");
  return response;
}

export async function GET(request: NextRequest) {
  const origin = resolveAppOrigin(request);
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description") ?? undefined;

  if (error || !code) {
    return redirectWithError(
      origin,
      error || "MISSING_CODE",
      errorDescription || "Người dùng đã hủy hoặc Zalo không trả về authorization code.",
    );
  }

  const cookieState = request.cookies.get("zalo_state")?.value;
  const codeVerifier = request.cookies.get("zalo_code_verifier")?.value;

  if (!state || !cookieState || state !== cookieState) {
    return redirectWithError(
      origin,
      "STATE_MISMATCH",
      "State không khớp (có thể cookie bị trình duyệt nhúng xóa hoặc phiên hết hạn sau 10 phút).",
    );
  }

  if (!codeVerifier) {
    return redirectWithError(
      origin,
      "MISSING_VERIFIER",
      "Không tìm thấy PKCE code_verifier trong cookie.",
    );
  }

  const appId = process.env.ZALO_APP_ID?.trim();
  const secretKey = process.env.ZALO_APP_SECRET?.trim();

  if (!appId || !secretKey) {
    return redirectWithError(
      origin,
      "CONFIG_MISSING",
      "Thiếu ZALO_APP_ID hoặc ZALO_APP_SECRET trong Environment Variables.",
    );
  }

  try {
    const tokenData = await exchangeZaloCode({
      code,
      appId,
      secretKey,
      codeVerifier,
    });

    if (!tokenData.access_token) {
      return redirectWithError(
        origin,
        String(tokenData.error ?? tokenData.error_name ?? "TOKEN_EXCHANGE_FAILED"),
        tokenData.error_description || tokenData.message || "Không đổi được Zalo access_token.",
      );
    }

    const profile = await getZaloUserInfo(tokenData.access_token);

    if (profile.error !== 0 || !profile.id) {
      return redirectWithError(
        origin,
        `PROFILE_ERROR_${profile.error}`,
        profile.message || "Không lấy được thông tin từ /v2.0/me.",
      );
    }

    const sessionPayload: ZaloSpikeSession = {
      id: profile.id,
      name: profile.name ?? "(Không có tên)",
      pictureUrl: profile.picture?.data?.url ?? null,
      isSensitive: typeof profile.is_sensitive === "boolean" ? profile.is_sensitive : null,
      rawProfile: profile,
      authenticatedAt: new Date().toISOString(),
    };

    const spikeUrl = new URL("/zalo-spike", origin);
    spikeUrl.searchParams.set("success", "1");

    const response = NextResponse.redirect(spikeUrl);
    const isSecure = origin.startsWith("https://");

    response.cookies.set("zalo_spike_user", JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.delete("zalo_code_verifier");
    response.cookies.delete("zalo_state");

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định khi gọi Zalo API.";
    return redirectWithError(origin, "ZALO_REQUEST_FAILED", message);
  }
}
