import { NextRequest, NextResponse } from "next/server";
import { buildDashboardMetricLogic } from "@/lib/dashboardMetricLogic";
import { getMetaConnection, getRequiredClientById } from "@/lib/clientStore";
import { fetchMetaInsightsPreviewForRange, normalizeMetaPreviewRows } from "@/lib/integrations/meta";
import { fetchTikTokPaidMediaRows } from "@/lib/integrations/tiktok";
import { listMetricMappings } from "@/lib/metricMappingStore";
import { listMetricOverrides } from "@/lib/metricOverrideStore";
import { buildBlendedPaidMediaReport, type PaidMediaSourceType } from "@/lib/paidMediaContract";
import { getTikTokConnection } from "@/lib/tiktokConnectionStore";
import { getGoogleAdsConnection } from "@/lib/googleAdsConnectionStore";
import { fetchGoogleAdsPaidMediaRows } from "@/lib/integrations/googleAds";

export async function GET(request: NextRequest) {
  try {
    const client = await getRequiredClientById(request.nextUrl.searchParams.get("clientId"));
    const dateRange = {
      datePreset: request.nextUrl.searchParams.get("datePreset") ?? undefined,
      since: request.nextUrl.searchParams.get("since") ?? undefined,
      until: request.nextUrl.searchParams.get("until") ?? undefined,
    };
    const [metaConnection, tiktokConnection, googleConnection, overrides, mappings] = await Promise.all([
      getMetaConnection(client.id),
      getTikTokConnection(client.id),
      getGoogleAdsConnection(client.id),
      listMetricOverrides(),
      listMetricMappings(),
    ]);
    const metricLogic = buildDashboardMetricLogic(overrides, mappings, { clientId: client.id });
    const configuredChannels = metricLogic.includedChannels.total_ad_spend;
    const includedChannels = (configuredChannels?.length
      ? configuredChannels
      : ["meta", "tiktok"]) as PaidMediaSourceType[];
    const issues: Array<{ sourceType: PaidMediaSourceType; message: string }> = [];
    const fetchers: Array<{
      sourceType: PaidMediaSourceType;
      request: Promise<import("@/lib/paidMediaContract").NormalizedPaidMediaRow[]>;
    }> = [];

    if (includedChannels.includes("meta")) {
      if (metaConnection?.accessToken && metaConnection.selectedAccountId) {
        fetchers.push({
          sourceType: "meta",
          request: fetchMetaInsightsPreviewForRange(metaConnection.accessToken, metaConnection.selectedAccountId, {
            ...dateRange,
            clientId: client.id,
          }).then((rows) => normalizeMetaPreviewRows(rows, { clientId: client.id, dateRange }))
        });
      } else {
        issues.push({ sourceType: "meta", message: "Meta is not connected or has no selected account." });
      }
    }

    if (includedChannels.includes("tiktok")) {
      if (tiktokConnection?.accessToken && tiktokConnection.selectedAdvertiserId) {
        fetchers.push({
          sourceType: "tiktok",
          request: fetchTikTokPaidMediaRows(
            tiktokConnection.accessToken,
            tiktokConnection.selectedAdvertiserId,
            { clientId: client.id, dateRange }
          ),
        });
      } else {
        issues.push({ sourceType: "tiktok", message: "TikTok is not connected or has no selected advertiser." });
      }
    }

    if (includedChannels.includes("google")) {
      if (googleConnection?.accessToken && googleConnection.selectedCustomerId) {
        const until = dateRange.until ?? new Date().toISOString().slice(0, 10);
        const since = dateRange.since ?? new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
        fetchers.push({
          sourceType: "google",
          request: fetchGoogleAdsPaidMediaRows({
            accessToken: googleConnection.accessToken,
            customerId: googleConnection.selectedCustomerId,
            loginCustomerId: googleConnection.loginCustomerId,
            clientId: client.id,
            since,
            until,
          }),
        });
      } else {
        issues.push({ sourceType: "google", message: "Google Ads is not connected or has no selected customer." });
      }
    }

    const results = await Promise.allSettled(fetchers.map((fetcher) => fetcher.request));
    const rows = results.flatMap((result, index) => {
      if (result.status === "fulfilled") return result.value;
      issues.push({ sourceType: fetchers[index].sourceType, message: result.reason instanceof Error ? result.reason.message : "Paid-media source request failed." });
      return [];
    });
    const report = buildBlendedPaidMediaReport(rows, includedChannels);

    return NextResponse.json({
      clientId: client.id,
      dateRange,
      ...report,
      issues,
      implementationStatus: tiktokConnection
        ? "implemented_awaiting_live_validation"
        : "partial_connections",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load blended paid-media reporting." },
      { status: 500 }
    );
  }
}
