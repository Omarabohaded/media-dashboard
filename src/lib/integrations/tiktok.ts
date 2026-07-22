import type {
  DiscoveredSourceConversionEvent,
  NormalizedPaidMediaRow,
  PaidMediaDateRange,
} from "@/lib/paidMediaContract";
import { derivePaidMediaMetrics } from "@/lib/paidMediaContract";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";
import {
  buildTikTokEventDiscoveryQuery,
  buildTikTokPaidMediaQuery,
  extractTikTokMappedMetrics,
  extractTikTokReportEvents,
  type TikTokReportRow,
} from "@/lib/integrations/tiktokReportContract";

export const TIKTOK_STATE_COOKIE = "tiktok_oauth_state";
export const TIKTOK_OAUTH_CLIENT_COOKIE = "tiktok_oauth_client_id";

export type TikTokConfig = {
  appId: string;
  appSecret: string;
  apiBase: string;
  oauthBase: string;
  scopes: string[];
  missingEnv: string[];
};

export type TikTokAdvertiserAccount = {
  advertiserId: string;
  advertiserName: string;
  raw: unknown;
};

export type TikTokRawEvent = {
  eventName: string;
  label: string;
  roles: Array<"purchases" | "purchaseValue">;
  raw: unknown;
};

type TikTokApiPayload<T> = {
  code?: number;
  message?: string;
  request_id?: string;
  data?: T;
};

type TikTokTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  advertiser_ids?: string[];
};

type TikTokAdvertiserResponse = {
  list?: Array<{
    advertiser_id?: string;
    advertiser_name?: string;
    name?: string;
    [key: string]: unknown;
  }>;
  advertiser_ids?: string[];
};

type TikTokReportResponse = {
  list?: TikTokReportRow[];
  page_info?: {
    page?: number;
    page_size?: number;
    total_page?: number;
    total_number?: number;
  };
};

function requiredEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getSecureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

export function getTikTokConfig(): TikTokConfig {
  const appId = requiredEnv("TIKTOK_APP_ID");
  const appSecret = requiredEnv("TIKTOK_APP_SECRET");
  const apiBase =
    requiredEnv("TIKTOK_API_BASE") || "https://business-api.tiktok.com/open_api/v1.3";
  const oauthBase =
    requiredEnv("TIKTOK_OAUTH_BASE") || "https://business-api.tiktok.com/portal/auth";
  const scopes = (requiredEnv("TIKTOK_SCOPES") || "advertiser.read,reporting.read")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    appId,
    appSecret,
    apiBase,
    oauthBase,
    scopes,
    missingEnv: ["TIKTOK_APP_ID", "TIKTOK_APP_SECRET"].filter(
      (key) => !requiredEnv(key)
    ),
  };
}

export function buildTikTokRedirectUri(origin: string) {
  return `${origin}/api/integrations/tiktok/callback`;
}

export function buildTikTokOauthUrl(origin: string, state: string) {
  const config = getTikTokConfig();
  const params = new URLSearchParams({
    app_id: config.appId,
    redirect_uri: buildTikTokRedirectUri(origin),
    state,
    scope: config.scopes.join(","),
  });

  return `${config.oauthBase}?${params.toString()}`;
}

async function parseTikTokResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as TikTokApiPayload<T>;

  if (!response.ok || (typeof payload.code === "number" && payload.code !== 0)) {
    throw new Error(payload.message || "TikTok API request failed.");
  }

  return (payload.data ?? payload) as T;
}

async function tiktokGet<T>(
  path: string,
  accessToken: string,
  searchParams: Record<string, string | number | boolean | readonly string[] | undefined> = {}
) {
  const config = getTikTokConfig();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    params.set(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
  }
  const response = await fetch(`${config.apiBase}${path}?${params.toString()}`, {
    method: "GET",
    headers: {
      "Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return parseTikTokResponse<T>(response);
}

async function tiktokPost<T>(path: string, accessToken: string | null, body: unknown) {
  const config = getTikTokConfig();
  const response = await fetch(`${config.apiBase}${path}`, {
    method: "POST",
    headers: {
      ...(accessToken ? { "Access-Token": accessToken } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return parseTikTokResponse<T>(response);
}

export async function exchangeTikTokCodeForToken(code: string) {
  const config = getTikTokConfig();
  return tiktokPost<TikTokTokenResponse>("/oauth2/access_token/", null, {
    app_id: config.appId,
    secret: config.appSecret,
    auth_code: code,
  });
}

export async function refreshTikTokAccessToken(refreshToken: string) {
  const config = getTikTokConfig();
  return tiktokPost<TikTokTokenResponse>("/oauth2/refresh_token/", null, {
    app_id: config.appId,
    secret: config.appSecret,
    refresh_token: refreshToken,
  });
}

export async function fetchTikTokAdvertisers(accessToken: string) {
  const config = getTikTokConfig();
  const response = await tiktokGet<TikTokAdvertiserResponse>(
    "/oauth2/advertiser/get/",
    accessToken,
    {
      app_id: config.appId,
      secret: config.appSecret,
    }
  );

  if (response.list?.length) {
    return response.list.map<TikTokAdvertiserAccount>((account) => ({
      advertiserId: String(account.advertiser_id ?? ""),
      advertiserName: String(account.advertiser_name ?? account.name ?? account.advertiser_id ?? "TikTok advertiser"),
      raw: account,
    })).filter((account) => account.advertiserId);
  }

  return (response.advertiser_ids ?? []).map<TikTokAdvertiserAccount>((advertiserId) => ({
    advertiserId,
    advertiserName: advertiserId,
    raw: { advertiser_id: advertiserId },
  }));
}

export async function fetchTikTokRawConversionEvents(
  accessToken: string,
  advertiserId: string,
  options: PaidMediaDateRange = {}
) {
  const today = new Date().toISOString().slice(0, 10);
  const query = buildTikTokEventDiscoveryQuery({
    advertiserId,
    startDate: options.since ?? today,
    endDate: options.until ?? today,
  });

  const response = await tiktokGet<TikTokReportResponse>(
    "/report/integrated/get/",
    accessToken,
    query
  );

  const rows = response.list ?? [];
  const events: TikTokRawEvent[] = extractTikTokReportEvents(rows);

  return {
    advertiserId,
    rawRows: rows,
    events,
  };
}

export async function discoverTikTokConversionEvents(
  accessToken: string,
  advertiserId: string,
  clientId: string,
  options: PaidMediaDateRange = {}
): Promise<DiscoveredSourceConversionEvent[]> {
  const discovered = await fetchTikTokRawConversionEvents(accessToken, advertiserId, options);
  return toDiscoveredTikTokConversionEvents(discovered.events, clientId);
}

export function toDiscoveredTikTokConversionEvents(
  events: TikTokRawEvent[],
  clientId: string,
  discoveredAt = new Date().toISOString()
): DiscoveredSourceConversionEvent[] {
  return events.map((event) => ({
    sourceType: "tiktok",
    clientId,
    eventName: event.eventName,
    label: event.label,
    roles: event.roles,
    firstSeenAt: discoveredAt,
    lastSeenAt: discoveredAt,
  }));
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchTikTokPaidMediaRows(
  accessToken: string,
  advertiserId: string,
  input: { clientId: string; dateRange: PaidMediaDateRange }
): Promise<NormalizedPaidMediaRow[]> {
  const mapping = await resolveSourceConversionMapping("tiktok", input.clientId);
  const today = new Date().toISOString().slice(0, 10);
  const startDate = input.dateRange.since ?? today;
  const endDate = input.dateRange.until ?? today;
  const rows: TikTokReportRow[] = [];
  let page = 1;

  while (true) {
    const query = buildTikTokPaidMediaQuery({
      advertiserId,
      startDate,
      endDate,
      purchasesEvent: mapping.purchasesEvent,
      purchaseValueEvent: mapping.purchaseValueEvent,
      page,
    });
    const response = await tiktokGet<TikTokReportResponse>(
      "/report/integrated/get/",
      accessToken,
      query
    );
    rows.push(...(response.list ?? []));
    const totalPages = numberValue(response.page_info?.total_page);
    if (!totalPages || page >= totalPages) break;
    page += 1;
  }

  return normalizeTikTokRows(rows, input, mapping);
}

export async function normalizeTikTokRows(
  rows: TikTokReportRow[],
  input: {
    clientId: string;
    dateRange: PaidMediaDateRange;
  },
  resolvedMapping?: Awaited<ReturnType<typeof resolveSourceConversionMapping>>
): Promise<NormalizedPaidMediaRow[]> {
  const mapping = resolvedMapping ?? await resolveSourceConversionMapping("tiktok", input.clientId);

  return rows.map((row) => {
    const metrics = row.metrics ?? {};
    const { spend, impressions, clicks, purchases, purchaseValue } =
      extractTikTokMappedMetrics(row, mapping);
    const dimensions = row.dimensions ?? {};
    const campaignId = String(dimensions.campaign_id ?? "") || null;

    return {
      spend,
      impressions,
      clicks,
      purchases,
      purchaseValue,
      sourceType: "tiktok",
      channel: "tiktok",
      clientId: input.clientId,
      dateRange: input.dateRange,
      ...derivePaidMediaMetrics({ spend, impressions, clicks, purchaseValue }),
      conversionMappingStatus: mapping.status,
      purchasesEvent: mapping.purchasesEvent,
      purchaseValueEvent: mapping.purchaseValueEvent,
      sourceRecordId: campaignId,
      sourceRecordName: String(dimensions.campaign_name ?? "") || null,
      rawMetadata: {
        dimensions,
        sourceMetrics: metrics,
      },
    };
  });
}
