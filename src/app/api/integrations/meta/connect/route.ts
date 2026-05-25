import { NextRequest, NextResponse } from "next/server";
import {
  buildMetaOauthUrl,
  getMetaConfig,
  getSecureCookieFlag,
  META_OAUTH_CLIENT_COOKIE,
  META_STATE_COOKIE,
} from "@/lib/integrations/meta";
import { getClientById } from "@/lib/clientStore";

export async function GET(request: NextRequest) {
  const config = getMetaConfig();
  const origin = request.nextUrl.origin;
  const client = await getClientById(request.nextUrl.searchParams.get("clientId"));

  if (config.missingEnv.length > 0) {
    return NextResponse.redirect(
      new URL(`/admin?clientId=${client.id}&meta_error=missing_config`, origin)
    );
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(buildMetaOauthUrl(origin, state));

  response.cookies.set(META_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: 60 * 15,
  });
  response.cookies.set(META_OAUTH_CLIENT_COOKIE, client.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: 60 * 15,
  });

  return response;
}
