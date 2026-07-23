import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { exchangeSnapCode, SNAP_CLIENT_COOKIE, SNAP_STATE_COOKIE } from "@/lib/integrations/snap";
import { upsertSnapConnection } from "@/lib/snapConnectionStore";
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin, clientId = request.cookies.get(SNAP_CLIENT_COOKIE)?.value;
  if (!clientId) return NextResponse.redirect(new URL("/admin?snap_error=missing_oauth_client", origin));
  const client = await getRequiredClientById(clientId), code = request.nextUrl.searchParams.get("code"), state = request.nextUrl.searchParams.get("state"), expected = request.cookies.get(SNAP_STATE_COOKIE)?.value;
  if (!code || !state || state !== expected || request.nextUrl.searchParams.get("error")) return NextResponse.redirect(new URL(`/admin?clientId=${client.id}&snap_error=invalid_oauth_state`, origin));
  try {
    const token = await exchangeSnapCode(code, origin);
    await upsertSnapConnection({ clientId: client.id, accessToken: token.access_token, refreshToken: token.refresh_token ?? null, connectedAt: new Date().toISOString(), accessTokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null, selectedAdAccountId: null, selectedAdAccountName: null, organizationId: null, lastDiscoveryAt: null, lastDiscoveryError: null, lastError: null });
    const response = NextResponse.redirect(new URL(`/admin?clientId=${client.id}&snap_connected=1`, origin)); response.cookies.delete(SNAP_STATE_COOKIE); response.cookies.delete(SNAP_CLIENT_COOKIE); return response;
  } catch (error) { return NextResponse.redirect(new URL(`/admin?clientId=${client.id}&snap_error=${encodeURIComponent(error instanceof Error ? error.message : "oauth_failed")}`, origin)); }
}
