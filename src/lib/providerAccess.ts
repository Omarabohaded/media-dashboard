import {
  getGoogleAdsConnection,
  upsertGoogleAdsConnection,
} from "@/lib/googleAdsConnectionStore";
import {
  refreshGoogleAdsAccessToken,
} from "@/lib/integrations/googleAds";
import { refreshSnapAccessToken } from "@/lib/integrations/snap";
import { refreshTikTokAccessToken } from "@/lib/integrations/tiktok";
import { executeWithTokenRefresh } from "@/lib/providerTokenManager";
import { getSnapConnection, upsertSnapConnection } from "@/lib/snapConnectionStore";
import {
  getTikTokConnection,
  upsertTikTokConnection,
} from "@/lib/tiktokConnectionStore";

export async function withTikTokAccess<T>(
  clientId: string,
  operation: (accessToken: string) => Promise<T>
) {
  const connection = await getTikTokConnection(clientId);
  if (!connection?.accessToken) throw new Error("TikTok is not connected.");
  try {
    return await executeWithTokenRefresh({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
      accessTokenExpiresAt: connection.accessTokenExpiresAt ?? null,
      refresh: async (token) => {
        const result = await refreshTikTokAccessToken(token);
        return {
          accessToken: result.access_token ?? "",
          refreshToken: result.refresh_token,
          expiresInSeconds: result.expires_in,
        };
      },
      persist: async (tokens) => {
        await upsertTikTokConnection({
          ...connection,
          ...tokens,
          lastError: null,
        });
      },
      operation,
    });
  } catch (error) {
    await upsertTikTokConnection({
      ...connection,
      lastError: `Token refresh/request failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    throw error;
  }
}

export async function withGoogleAdsAccess<T>(
  clientId: string,
  operation: (accessToken: string) => Promise<T>
) {
  const connection = await getGoogleAdsConnection(clientId);
  if (!connection?.accessToken) throw new Error("Google Ads is not connected.");
  try {
    return await executeWithTokenRefresh({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
      accessTokenExpiresAt: connection.accessTokenExpiresAt,
      refresh: async (token) => {
        const result = await refreshGoogleAdsAccessToken(token);
        return {
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
          expiresInSeconds: result.expires_in,
        };
      },
      persist: async (tokens) => {
        await upsertGoogleAdsConnection({
          ...connection,
          ...tokens,
          lastError: null,
        });
      },
      operation,
    });
  } catch (error) {
    await upsertGoogleAdsConnection({
      ...connection,
      lastError: `Token refresh/request failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    throw error;
  }
}

export async function withSnapAccess<T>(
  clientId: string,
  operation: (accessToken: string) => Promise<T>
) {
  const connection = await getSnapConnection(clientId);
  if (!connection?.accessToken) throw new Error("Snapchat is not connected.");
  try {
    return await executeWithTokenRefresh({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
      accessTokenExpiresAt: connection.accessTokenExpiresAt,
      refresh: async (token) => {
        const result = await refreshSnapAccessToken(token);
        return {
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
          expiresInSeconds: result.expires_in,
        };
      },
      persist: async (tokens) => {
        await upsertSnapConnection({
          ...connection,
          ...tokens,
          lastError: null,
        });
      },
      operation,
    });
  } catch (error) {
    await upsertSnapConnection({
      ...connection,
      lastError: `Token refresh/request failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    throw error;
  }
}
