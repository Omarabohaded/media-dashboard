import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import {
  buildTikTokOauthUrl,
  getSecureCookieFlag,
  getTikTokConfig,
  TIKTOK_OAUTH_CLIENT_COOKIE,
  TIKTOK_STATE_COOKIE,
} from "@/lib/integrations/tiktok";
import { requireClientIntegrationAccess } from "@/lib/serverAccess";

export async function GET(request: NextRequest) {
  const access = await requireClientIntegrationAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;
  const config = getTikTokConfig();
  const origin = request.nextUrl.origin;
  const client = await getRequiredClientById(access.clientId);

  if (config.missingEnv.length > 0) {
    return NextResponse.redirect(
      new URL(`/admin?clientId=${client.id}&tiktok_error=missing_config`, origin)
    );
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(buildTikTokOauthUrl(origin, state));

  response.cookies.set(TIKTOK_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: 60 * 15,
  });

  response.cookies.set(TIKTOK_OAUTH_CLIENT_COOKIE, client.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: 60 * 15,
  });

  return response;
}
