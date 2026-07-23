import { derivePaidMediaMetrics, type DiscoveredSourceConversionEvent, type NormalizedPaidMediaRow } from "@/lib/paidMediaContract";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";
import { buildGoogleAdsCampaignQuery, normalizeGoogleAdsRows, type GoogleAdsRow } from "./googleAdsContract";

const apiVersion = process.env.GOOGLE_ADS_API_VERSION || "v23";
const apiBase = `https://googleads.googleapis.com/${apiVersion}`;
export const GOOGLE_ADS_STATE_COOKIE = "google_ads_oauth_state";
export const GOOGLE_ADS_CLIENT_COOKIE = "google_ads_oauth_client";
export function getGoogleAdsConfig() {
  const values = {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
  };
  return { ...values, missingEnv: Object.entries(values).filter(([, value]) => !value).map(([key]) => `GOOGLE_ADS_${key === "clientId" ? "CLIENT_ID" : key === "clientSecret" ? "CLIENT_SECRET" : "DEVELOPER_TOKEN"}`) };
}
export function buildGoogleAdsRedirectUri(origin: string) { return `${origin}/api/integrations/google/callback`; }
export function buildGoogleAdsOauthUrl(origin: string, state: string) {
  const config = getGoogleAdsConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: buildGoogleAdsRedirectUri(origin),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/adwords",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
export async function exchangeGoogleAdsCode(code: string, origin: string) {
  const config = getGoogleAdsConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: buildGoogleAdsRedirectUri(origin), grant_type: "authorization_code" }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_description ?? "Google OAuth token exchange failed.");
  return payload as { access_token: string; refresh_token?: string; expires_in?: number };
}
export async function refreshGoogleAdsAccessToken(refreshToken: string) {
  const config = getGoogleAdsConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      payload.error_description ?? payload.error ?? "Google OAuth token refresh failed."
    );
  }
  return payload as { access_token: string; refresh_token?: string; expires_in?: number };
}
async function googleRequest(path: string, accessToken: string, init?: RequestInit, loginCustomerId?: string | null) {
  const config = getGoogleAdsConfig();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": config.developerToken,
      ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${payload?.error?.message ?? "Google Ads API request failed."}`);
  return payload;
}
export async function fetchGoogleAdsCustomers(accessToken: string): Promise<Array<{ customerId: string; customerName: string; resourceName: string; currencyCode: string | null }>> {
  const payload = await googleRequest("/customers:listAccessibleCustomers", accessToken);
  return Promise.all(
    (payload.resourceNames ?? []).map(async (resourceName: string) => {
      const customerId = resourceName.split("/").pop()!;
      try {
        const metadata = await googleRequest(
          `/customers/${customerId}/googleAds:searchStream`,
          accessToken,
          {
            method: "POST",
            body: JSON.stringify({
              query:
                "SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1",
            }),
          }
        );
        const customer = (
          metadata as Array<{
            results?: Array<{
              customer?: {
                descriptiveName?: string;
                currencyCode?: string;
              };
            }>;
          }>
        ).flatMap((batch) => batch.results ?? [])[0]?.customer;
        return {
          customerId,
          customerName: customer?.descriptiveName || resourceName,
          resourceName,
          currencyCode: customer?.currencyCode ?? null,
        };
      } catch {
        return {
          customerId,
          customerName: resourceName,
          resourceName,
          currencyCode: null,
        };
      }
    })
  );
}
export async function fetchGoogleAdsConversionEvents(accessToken: string, customerId: string, loginCustomerId?: string | null): Promise<DiscoveredSourceConversionEvent[]> {
  const query = "SELECT conversion_action.resource_name, conversion_action.name, conversion_action.status, conversion_action.category FROM conversion_action WHERE conversion_action.status = 'ENABLED'";
  const payload = await googleRequest(`/customers/${customerId}/googleAds:searchStream`, accessToken, { method: "POST", body: JSON.stringify({ query }) }, loginCustomerId);
  const rows = (payload as Array<{ results?: Array<{ conversionAction?: { resourceName?: string; name?: string; category?: string } }> }>).flatMap((batch) => batch.results ?? []);
  const now = new Date().toISOString();
  return rows.map((row) => ({ sourceType: "google", clientId: null, eventName: row.conversionAction?.resourceName ?? "", label: row.conversionAction?.name ?? row.conversionAction?.resourceName ?? "Conversion", roles: ["purchases", "purchaseValue"], firstSeenAt: now, lastSeenAt: now }));
}
export async function fetchGoogleAdsPaidMediaRows(input: { accessToken: string; customerId: string; loginCustomerId?: string | null; clientId: string; since: string; until: string }): Promise<NormalizedPaidMediaRow[]> {
  const mapping = await resolveSourceConversionMapping("google", input.clientId);
  const query = buildGoogleAdsCampaignQuery({ purchasesAction: mapping.purchasesEvent, purchaseValueAction: mapping.purchaseValueEvent, since: input.since, until: input.until });
  const payload = await googleRequest(`/customers/${input.customerId}/googleAds:searchStream`, input.accessToken, { method: "POST", body: JSON.stringify({ query }) }, input.loginCustomerId);
  const rows = (payload as Array<{ results?: GoogleAdsRow[] }>).flatMap((batch) => batch.results ?? []);
  return normalizeGoogleAdsRows(rows, { clientId: input.clientId, purchasesAction: mapping.purchasesEvent, purchaseValueAction: mapping.purchaseValueEvent, mappingStatus: mapping.status, since: input.since, until: input.until }).map((row) => ({ ...row, ...derivePaidMediaMetrics(row) }));
}
