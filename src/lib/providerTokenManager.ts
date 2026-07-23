export type RefreshResult = {
  accessToken: string;
  refreshToken?: string | null;
  expiresInSeconds?: number | null;
};

export function shouldRefreshAccessToken(
  expiresAt: string | null | undefined,
  now = Date.now(),
  refreshWindowMs = 5 * 60 * 1000
) {
  if (!expiresAt) return false;
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) && expiry <= now + refreshWindowMs;
}

export function isProviderAuthenticationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /(?:401|403|unauthori[sz]ed|invalid[_ -]?token|access[_ -]?token.*(?:expired|invalid)|token.*(?:expired|revoked))/i.test(
    message
  );
}

export async function executeWithTokenRefresh<T>(input: {
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  refresh: (refreshToken: string) => Promise<RefreshResult>;
  persist: (tokens: {
    accessToken: string;
    refreshToken: string | null;
    accessTokenExpiresAt: string | null;
  }) => Promise<void>;
  operation: (accessToken: string) => Promise<T>;
  now?: () => number;
}) {
  const now = input.now ?? Date.now;
  let accessToken = input.accessToken;
  let refreshToken = input.refreshToken;
  let expiresAt = input.accessTokenExpiresAt;
  let refreshed = false;

  const refreshOnce = async () => {
    if (refreshed) throw new Error("Access token refresh already attempted.");
    if (!refreshToken) throw new Error("Access token expired and no refresh token is available.");
    refreshed = true;
    const result = await input.refresh(refreshToken);
    if (!result.accessToken) throw new Error("Provider refresh did not return an access token.");
    accessToken = result.accessToken;
    refreshToken = result.refreshToken || refreshToken;
    expiresAt = result.expiresInSeconds
      ? new Date(now() + result.expiresInSeconds * 1000).toISOString()
      : null;
    await input.persist({
      accessToken,
      refreshToken,
      accessTokenExpiresAt: expiresAt,
    });
  };

  if (shouldRefreshAccessToken(expiresAt, now())) {
    await refreshOnce();
  }

  try {
    return await input.operation(accessToken);
  } catch (error) {
    if (refreshed || !isProviderAuthenticationError(error)) throw error;
    await refreshOnce();
    return input.operation(accessToken);
  }
}
