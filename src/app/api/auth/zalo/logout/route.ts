import { NextRequest, NextResponse } from "next/server";
import { resolveAppOrigin } from "@/lib/zalo";

export async function GET(request: NextRequest) {
  const origin = resolveAppOrigin(request);
  const response = NextResponse.redirect(new URL("/zalo-spike", origin));

  response.cookies.delete("zalo_spike_user");
  response.cookies.delete("zalo_code_verifier");
  response.cookies.delete("zalo_state");

  return response;
}
