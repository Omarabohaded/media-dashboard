import { NextRequest, NextResponse } from "next/server";
import {
  exchangeMetaCodeForToken,
  fetchMetaAdAccounts,
  getMetaConfig,
  getSecureCookieFlag,
  META_ACCOUNT_COOKIE,
  META_STATE_COOKIE,
  META_TOKEN_COOKIE,
} from "@/lib/integrations/meta";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const config = getMetaConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(META_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL(`/admin?meta_error=invalid_oauth_state`, origin)
    );
  }

  if (config.missingEnv.length > 0) {
    return NextResponse.redirect(
      new URL(`/admin?meta_error=missing_config`, origin)
    );
  }

  try {
    const token = await exchangeMetaCodeForToken(origin, code);
    const accounts = await fetchMetaAdAccounts(token.access_token);
    const response = NextResponse.redirect(
      new URL(`/admin?meta_connected=1`, origin)
    );

    response.cookies.set(META_TOKEN_COOKIE, token.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: getSecureCookieFlag(),
      path: "/",
      maxAge: Math.max(60 * 30, token.expires_in ?? 60 * 60),
    });
    response.cookies.delete(META_STATE_COOKIE);

    if (accounts.length === 1) {
      response.cookies.set(META_ACCOUNT_COOKIE, accounts[0].id, {
        httpOnly: true,
        sameSite: "lax",
        secure: getSecureCookieFlag(),
        path: "/",
        maxAge: 60 * 60 * 12,
      });
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "oauth_exchange_failed";
    return NextResponse.redirect(
      new URL(
        `/admin?meta_error=${encodeURIComponent(message)}`,
        origin
      )
    );
  }
}
