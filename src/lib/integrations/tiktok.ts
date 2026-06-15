import type {
  DiscoveredSourceConversionEvent,
  NormalizedPaidMediaRow,
  PaidMediaDateRange,
} from "@/lib/paidMediaContract";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";

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

type TikTokReportRow = {
  dimensions?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  [key: string]: unknown;
};

type TikTokReportResponse = {
  list?: TikTokReportRow[];
  page_info?: unknown;
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
  searchParams: Record<string, string> = {}
) {
  const config = getTikTokConfig();
  const params = new URLSearchParams(searchParams);
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

function extractEventName(row: TikTokReportRow) {
  const dimensions = row.dimensions ?? {};
  const metrics = row.metrics ?? {};
  const candidates = [
    dimensions.event,
    dimensions.event_name,
    dimensions.conversion_event,
    dimensions.conversion_event_name,
    dimensions.statistical_type,
    metrics.event,
    metrics.event_name,
    metrics.conversion_event,
    metrics.conversion_event_name,
  ];

  return candidates.find((value) => typeof value === "string" && value.trim()) as string | undefined;
}

export async function fetchTikTokRawConversionEvents(
  accessToken: string,
  advertiserId: string,
  options: PaidMediaDateRange = {}
) {
  const today = new Date().toISOString().slice(0, 10);
  const body = {
    advertiser_id: advertiserId,
    report_type: "BASIC",
    data_level: "AUCTION_CAMPAIGN",
    dimensions: ["campaign_id"],
    metrics: ["spend", "impressions", "clicks", "conversion", "conversion_value"],
    start_date: options.since ?? today,
    end_date: options.until ?? today,
    page: 1,
    page_size: 100,
  };

  const response = await tiktokPost<TikTokReportResponse>(
    "/report/integrated/get/",
    accessToken,
    body
  );

  const eventsByName = new Map<string, TikTokRawEvent>();

  for (const row of response.list ?? []) {
    const eventName = extractEventName(row);
    if (!eventName || eventsByName.has(eventName)) continue;
    eventsByName.set(eventName, {
      eventName,
      label: eventName,
      raw: row,
    });
  }

  return {
    advertiserId,
    rawRows: response.list ?? [],
    events: [...eventsByName.values()],
  };
}

export async function discoverTikTokConversionEvents(
  accessToken: string,
  advertiserId: string,
  clientId: string,
  options: PaidMediaDateRange = {}
): Promise<DiscoveredSourceConversionEvent[]> {
  const discovered = await fetchTikTokRawConversionEvents(accessToken, advertiserId, options);
  const now = new Date().toISOString();

  return discovered.events.map((event) => ({
    sourceType: "tiktok",
    clientId,
    eventName: event.eventName,
    label: event.label,
    roles: ["purchases", "purchaseValue"],
    firstSeenAt: now,
    lastSeenAt: now,
  }));
}

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

export async function normalizeTikTokRows(
  rows: TikTokReportRow[],
  input: {
    clientId: string;
    dateRange: PaidMediaDateRange;
  }
): Promise<NormalizedPaidMediaRow[]> {
  const mapping = await resolveSourceConversionMapping("tiktok", input.clientId);

  return rows.map((row) => {
    const metrics = row.metrics ?? {};
    const spend = numberValue(metrics.spend);
    const impressions = numberValue(metrics.impressions);
    const clicks = numberValue(metrics.clicks);

    return {
      spend,
      impressions,
      clicks,
      purchases: 0,
      purchaseValue: 0,
      sourceType: "tiktok",
      channel: "tiktok",
      clientId: input.clientId,
      dateRange: input.dateRange,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : undefined,
      cpc: clicks > 0 ? spend / clicks : undefined,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : undefined,
      roas: undefined,
      conversionMappingStatus: mapping.status,
      purchasesEvent: mapping.purchasesEvent,
      purchaseValueEvent: mapping.purchaseValueEvent,
    };
  });
}
