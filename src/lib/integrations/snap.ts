import { derivePaidMediaMetrics, type DiscoveredSourceConversionEvent, type NormalizedPaidMediaRow } from "@/lib/paidMediaContract";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";
import { buildSnapStatsQuery, normalizeSnapCampaignStats, type SnapStats } from "./snapContract";
const base = "https://adsapi.snapchat.com/v1";
export const SNAP_STATE_COOKIE = "snap_oauth_state", SNAP_CLIENT_COOKIE = "snap_oauth_client";
export function getSnapConfig() {
  const values = { clientId: process.env.SNAP_CLIENT_ID || "", clientSecret: process.env.SNAP_CLIENT_SECRET || "" };
  return { ...values, missingEnv: Object.entries(values).filter(([, value]) => !value).map(([key]) => key === "clientId" ? "SNAP_CLIENT_ID" : "SNAP_CLIENT_SECRET") };
}
export function buildSnapRedirectUri(origin: string) { return `${origin}/api/integrations/snap/callback`; }
export function buildSnapOauthUrl(origin: string, state: string) { const config = getSnapConfig(); return `https://accounts.snapchat.com/login/oauth2/authorize?${new URLSearchParams({ client_id: config.clientId, redirect_uri: buildSnapRedirectUri(origin), response_type: "code", scope: "snapchat-marketing-api", state })}`; }
export async function exchangeSnapCode(code: string, origin: string) {
  const config = getSnapConfig(); const response = await fetch("https://accounts.snapchat.com/login/oauth2/access_token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: buildSnapRedirectUri(origin) }) });
  const payload = await response.json(); if (!response.ok) throw new Error(payload.error_description ?? "Snap OAuth failed."); return payload as { access_token: string; refresh_token?: string; expires_in?: number };
}
async function snapGet(path: string, accessToken: string) { const response = await fetch(path.startsWith("http") ? path : `${base}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } }); const payload = await response.json(); if (!response.ok || String(payload.request_status ?? "success").toLowerCase() === "error") throw new Error(payload.debug_message ?? "Snap API request failed."); return payload; }
export async function fetchSnapAdAccounts(accessToken: string): Promise<Array<{ adAccountId: string; adAccountName: string; organizationId: string }>> {
  const payload = await snapGet("/me/organizations?with_ad_accounts=true", accessToken);
  return (payload.organizations ?? []).flatMap((wrapper: { organization?: { id?: string; ad_accounts?: Array<{ id?: string; name?: string }> } }) => (wrapper.organization?.ad_accounts ?? []).map((account) => ({ adAccountId: account.id ?? "", adAccountName: account.name ?? account.id ?? "Snap ad account", organizationId: wrapper.organization?.id ?? "" })));
}
export function discoverSnapConversionEvents(clientId: string): DiscoveredSourceConversionEvent[] {
  const now = new Date().toISOString();
  return [
    { sourceType: "snap", clientId, eventName: "conversion_purchases", label: "Purchases", roles: ["purchases"], firstSeenAt: now, lastSeenAt: now },
    { sourceType: "snap", clientId, eventName: "conversion_purchases_value", label: "Purchase value", roles: ["purchaseValue"], firstSeenAt: now, lastSeenAt: now },
  ];
}
export async function fetchSnapPaidMediaRows(input: { accessToken: string; adAccountId: string; clientId: string; since: string; until: string }): Promise<NormalizedPaidMediaRow[]> {
  const mapping = await resolveSourceConversionMapping("snap", input.clientId);
  const query = buildSnapStatsQuery({ purchasesEvent: mapping.purchasesEvent, purchaseValueEvent: mapping.purchaseValueEvent, since: input.since, until: input.until });
  const payload = await snapGet(`/adaccounts/${input.adAccountId}/stats?${query}`, input.accessToken);
  const rows = (payload.total_stats ?? []).map((wrapper: { total_stat?: { id?: string; stats?: SnapStats } }) => ({ id: wrapper.total_stat?.id ?? "unknown", stats: wrapper.total_stat?.stats ?? {} }));
  return normalizeSnapCampaignStats(rows, { clientId: input.clientId, purchasesEvent: mapping.purchasesEvent, purchaseValueEvent: mapping.purchaseValueEvent, mappingStatus: mapping.status, since: input.since, until: input.until }).map((row) => ({ ...row, ...derivePaidMediaMetrics(row) }));
}
