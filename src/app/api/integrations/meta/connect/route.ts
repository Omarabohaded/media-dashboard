import { NextRequest, NextResponse } from "next/server";
import {
  buildMetaOauthUrl,
  getMetaConfig,
  getSecureCookieFlag,
  META_STATE_COOKIE,
} from "@/lib/integrations/meta";

export async function GET(request: NextRequest) {
  const config = getMetaConfig();
  const origin = request.nextUrl.origin;

  if (config.missingEnv.length > 0) {
    return NextResponse.redirect(
      new URL(`/admin?meta_error=missing_config`, origin)
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

  return response;
}
