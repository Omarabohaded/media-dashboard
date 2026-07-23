import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { buildGoogleAdsOauthUrl, getGoogleAdsConfig, GOOGLE_ADS_CLIENT_COOKIE, GOOGLE_ADS_STATE_COOKIE } from "@/lib/integrations/googleAds";
import { requireClientIntegrationAccess } from "@/lib/serverAccess";

export async function GET(request: NextRequest) {
  const access = await requireClientIntegrationAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;
  const client = await getRequiredClientById(access.clientId);
  const config = getGoogleAdsConfig();
  if (config.missingEnv.length) return NextResponse.redirect(new URL(`/admin?clientId=${client.id}&google_error=missing_config`, request.nextUrl.origin));
  const state = crypto.randomUUID();
  const response = NextResponse.redirect(buildGoogleAdsOauthUrl(request.nextUrl.origin, state));
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 900 };
  response.cookies.set(GOOGLE_ADS_STATE_COOKIE, state, options);
  response.cookies.set(GOOGLE_ADS_CLIENT_COOKIE, client.id, options);
  return response;
}
