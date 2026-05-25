export const META_STATE_COOKIE = "meta_oauth_state";
export const META_TOKEN_COOKIE = "meta_access_token";
export const META_ACCOUNT_COOKIE = "meta_account_id";

export type MetaConfig = {
  appId: string;
  appSecret: string;
  apiVersion: string;
  scopes: string[];
  appMode: string;
  missingEnv: string[];
};

export type MetaAdAccount = {
  id: string;
  name: string;
  account_status?: number;
  currency?: string;
  timezone_name?: string;
};

export type MetaInsightsPreviewRow = {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  reach: number;
  purchases: number;
  purchaseValue: number;
  addToCart: number;
  checkoutInitiated: number;
};

export function getSecureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

type MetaApiResponse<T> = {
  data?: T;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

type MetaInsightAction = {
  action_type: string;
  value: string;
};

type MetaInsightRecord = {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  reach?: string;
  actions?: MetaInsightAction[];
  action_values?: MetaInsightAction[];
};

function requiredEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getMetaConfig(): MetaConfig {
  const appId = requiredEnv("META_APP_ID");
  const appSecret = requiredEnv("META_APP_SECRET");
  const apiVersion = requiredEnv("META_API_VERSION");
  const appMode = requiredEnv("META_APP_MODE") || "development";
  const scopes = (requiredEnv("META_SCOPES") || "ads_read,ads_management,business_management")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const missingEnv = ["META_APP_ID", "META_APP_SECRET", "META_API_VERSION"].filter(
    (key) => !requiredEnv(key)
  );

  return {
    appId,
    appSecret,
    apiVersion,
    scopes,
    appMode,
    missingEnv,
  };
}

export function buildMetaRedirectUri(origin: string) {
  return `${origin}/api/integrations/meta/callback`;
}

export function buildMetaOauthUrl(origin: string, state: string) {
  const config = getMetaConfig();
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: buildMetaRedirectUri(origin),
    state,
    response_type: "code",
    scope: config.scopes.join(","),
  });

  return `https://www.facebook.com/${config.apiVersion}/dialog/oauth?${params.toString()}`;
}

async function parseMetaResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as MetaApiResponse<T>;

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || "Meta API request failed.");
  }

  return payload as T;
}

export async function exchangeMetaCodeForToken(origin: string, code: string) {
  const config = getMetaConfig();
  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: buildMetaRedirectUri(origin),
    code,
  });

  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}/oauth/access_token?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return parseMetaResponse<{ access_token: string; token_type?: string; expires_in?: number }>(
    response
  );
}

async function metaGraphGet<T>(
  path: string,
  searchParams: Record<string, string>,
  accessToken: string
): Promise<T> {
  const config = getMetaConfig();
  const params = new URLSearchParams({
    ...searchParams,
    access_token: accessToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}${path}?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return parseMetaResponse<T>(response);
}

export async function fetchMetaAdAccounts(accessToken: string) {
  const response = await metaGraphGet<{ data: MetaAdAccount[] }>(
    "/me/adaccounts",
    {
      fields: "id,name,account_status,currency,timezone_name",
      limit: "25",
    },
    accessToken
  );

  return response.data ?? [];
}

function getActionValue(actions: MetaInsightAction[] | undefined, actionType: string) {
  const match = actions?.find((item) => item.action_type === actionType);
  return Number(match?.value ?? 0);
}

export async function fetchMetaInsightsPreview(accessToken: string, accountId: string) {
  const response = await metaGraphGet<{ data: MetaInsightRecord[] }>(
    `/${accountId}/insights`,
    {
      level: "campaign",
      date_preset: "last_7d",
      limit: "25",
      fields:
        "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,frequency,reach,actions,action_values",
    },
    accessToken
  );

  return (response.data ?? []).map<MetaInsightsPreviewRow>((row) => ({
    campaignId: row.campaign_id ?? "unknown",
    campaignName: row.campaign_name ?? "Unnamed campaign",
    spend: Number(row.spend ?? 0),
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    ctr: Number(row.ctr ?? 0),
    cpc: Number(row.cpc ?? 0),
    cpm: Number(row.cpm ?? 0),
    frequency: Number(row.frequency ?? 0),
    reach: Number(row.reach ?? 0),
    purchases: getActionValue(row.actions, "purchase"),
    purchaseValue: getActionValue(row.action_values, "purchase"),
    addToCart: getActionValue(row.actions, "add_to_cart"),
    checkoutInitiated: getActionValue(row.actions, "initiate_checkout"),
  }));
}
