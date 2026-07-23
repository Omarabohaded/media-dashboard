import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { buildSnapOauthUrl, getSnapConfig, SNAP_CLIENT_COOKIE, SNAP_STATE_COOKIE } from "@/lib/integrations/snap";
export async function GET(request: NextRequest) {
  const client = await getRequiredClientById(request.nextUrl.searchParams.get("clientId")); const config = getSnapConfig();
  if (config.missingEnv.length) return NextResponse.redirect(new URL(`/admin?clientId=${client.id}&snap_error=missing_config`, request.nextUrl.origin));
  const state = crypto.randomUUID(), response = NextResponse.redirect(buildSnapOauthUrl(request.nextUrl.origin, state));
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 900 };
  response.cookies.set(SNAP_STATE_COOKIE, state, options); response.cookies.set(SNAP_CLIENT_COOKIE, client.id, options); return response;
}
