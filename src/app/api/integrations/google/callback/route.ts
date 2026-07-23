import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { exchangeGoogleAdsCode, GOOGLE_ADS_CLIENT_COOKIE, GOOGLE_ADS_STATE_COOKIE } from "@/lib/integrations/googleAds";
import { upsertGoogleAdsConnection } from "@/lib/googleAdsConnectionStore";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const clientId = request.cookies.get(GOOGLE_ADS_CLIENT_COOKIE)?.value;
  if (!clientId) return NextResponse.redirect(new URL("/admin?google_error=missing_oauth_client", origin));
  const client = await getRequiredClientById(clientId);
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get(GOOGLE_ADS_STATE_COOKIE)?.value;
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError || !code || !state || state !== expected) return NextResponse.redirect(new URL(`/admin?clientId=${client.id}&google_error=${encodeURIComponent(providerError ?? "invalid_oauth_state")}`, origin));
  try {
    const token = await exchangeGoogleAdsCode(code, origin);
    await upsertGoogleAdsConnection({
      clientId: client.id, accessToken: token.access_token, refreshToken: token.refresh_token ?? null,
      connectedAt: new Date().toISOString(), accessTokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
      selectedCustomerId: null, selectedCustomerName: null, loginCustomerId: null,
      lastDiscoveryAt: null, lastDiscoveryError: null, lastError: null,
    });
    const response = NextResponse.redirect(new URL(`/admin?clientId=${client.id}&google_connected=1`, origin));
    response.cookies.delete(GOOGLE_ADS_STATE_COOKIE); response.cookies.delete(GOOGLE_ADS_CLIENT_COOKIE);
    return response;
  } catch (error) {
    return NextResponse.redirect(new URL(`/admin?clientId=${client.id}&google_error=${encodeURIComponent(error instanceof Error ? error.message : "oauth_failed")}`, origin));
  }
}
