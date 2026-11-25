import crypto from "crypto";
import type { NextRequest } from "next/server";

export interface ZaloTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: string | number;
  refresh_token_expires_in?: string | number;
  error?: number;
  error_name?: string;
  error_description?: string;
  message?: string;
}

export interface ZaloUserProfile {
  error: number;
  message: string;
  id?: string;
  name?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
  is_sensitive?: boolean;
}

const VERIFIER_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Resolve public origin safely behind reverse proxies (Render) and in local dev.
 */
export function resolveAppOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (configured) {
    return configured;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
}

/**
 * Generate a 43-character alphanumeric PKCE code_verifier per Zalo OAuth v4 spec.
 */
export function generateCodeVerifier(length = 43): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    const byte = bytes[i] ?? 0;
    result += VERIFIER_CHARSET.charAt(byte % VERIFIER_CHARSET.length);
  }
  return result;
}

/**
 * Derive Base64URL (without padding) SHA-256 code_challenge from ASCII code_verifier.
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash("sha256")
    .update(verifier, "ascii")
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Generate random CSRF state token.
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Build Zalo OAuth v4 authorization URL.
 */
export function getZaloAuthUrl(params: {
  appId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}): string {
  const query = new URLSearchParams({
    app_id: params.appId,
    redirect_uri: params.redirectUri,
    code_challenge: params.codeChallenge,
    state: params.state,
  });

  return `https://oauth.zaloapp.com/v4/permission?${query.toString()}`;
}

/**
 * Exchange authorization code for Zalo User Access Token (server-side with secret_key).
 */
export async function exchangeZaloCode(params: {
  code: string;
  appId: string;
  secretKey: string;
  codeVerifier: string;
}): Promise<ZaloTokenResponse> {
  const body = new URLSearchParams({
    code: params.code,
    app_id: params.appId,
    grant_type: "authorization_code",
    code_verifier: params.codeVerifier,
  });

  const response = await fetch("https://oauth.zaloapp.com/v4/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: params.secretKey,
    },
    body: body.toString(),
    cache: "no-store",
  });

  return (await response.json()) as ZaloTokenResponse;
}

/**
 * Fetch Zalo user profile via Social API /v2.0/me.
 */
export async function getZaloUserInfo(accessToken: string): Promise<ZaloUserProfile> {
  const url =
    "https://graph.zalo.me/v2.0/me?fields=id,name,picture.type(large),is_sensitive";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      access_token: accessToken,
    },
    cache: "no-store",
  });

  return (await response.json()) as ZaloUserProfile;
}
