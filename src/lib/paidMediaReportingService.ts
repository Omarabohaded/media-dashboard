import { getMetaConnection, getRequiredClientById } from "@/lib/clientStore";
import { buildDashboardMetricLogic } from "@/lib/dashboardMetricLogic";
import { getGoogleAdsConnection } from "@/lib/googleAdsConnectionStore";
import { fetchGoogleAdsPaidMediaRows } from "@/lib/integrations/googleAds";
import { fetchMetaInsightsPreviewForRange, normalizeMetaPreviewRows } from "@/lib/integrations/meta";
import { fetchSnapPaidMediaRows } from "@/lib/integrations/snap";
import { fetchTikTokPaidMediaRows } from "@/lib/integrations/tiktok";
import { listMetricMappings } from "@/lib/metricMappingStore";
import { listMetricOverrides } from "@/lib/metricOverrideStore";
import { buildBlendedPaidMediaReport, type NormalizedPaidMediaRow, type PaidMediaDateRange, type PaidMediaSourceType } from "@/lib/paidMediaContract";
import { getSnapConnection } from "@/lib/snapConnectionStore";
import { getTikTokConnection } from "@/lib/tiktokConnectionStore";
import { executePaidMediaSync } from "@/lib/paidMediaSync";
export { summarizePortfolioPaidMedia } from "@/lib/portfolioReporting";

export async function buildClientPaidMediaReport(clientId: string, dateRange: PaidMediaDateRange) {
  const client = await getRequiredClientById(clientId);
  const [meta, tiktok, google, snap, overrides, mappings] = await Promise.all([
    getMetaConnection(client.id), getTikTokConnection(client.id), getGoogleAdsConnection(client.id),
    getSnapConnection(client.id), listMetricOverrides(), listMetricMappings(),
  ]);
  const logic = buildDashboardMetricLogic(overrides, mappings, { clientId: client.id });
  const configured = logic.includedChannels.total_ad_spend;
  const includedChannels = (configured?.length ? configured : ["meta", "tiktok", "google", "snap"]) as PaidMediaSourceType[];
  const issues: Array<{ sourceType: PaidMediaSourceType; message: string }> = [];
  const fetchers: Array<{ sourceType: PaidMediaSourceType; request: () => Promise<NormalizedPaidMediaRow[]> }> = [];
  const until = dateRange.until ?? new Date().toISOString().slice(0, 10);
  const since = dateRange.since ?? new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  if (includedChannels.includes("meta")) {
    if (meta?.accessToken && meta.selectedAccountId) fetchers.push({ sourceType: "meta", request: () => fetchMetaInsightsPreviewForRange(meta.accessToken, meta.selectedAccountId!, { ...dateRange, clientId }).then((rows) => normalizeMetaPreviewRows(rows, { clientId, dateRange })) });
    else issues.push({ sourceType: "meta", message: "Meta is not connected or has no selected account." });
  }
  if (includedChannels.includes("tiktok")) {
    if (tiktok?.accessToken && tiktok.selectedAdvertiserId) fetchers.push({ sourceType: "tiktok", request: () => fetchTikTokPaidMediaRows(tiktok.accessToken, tiktok.selectedAdvertiserId!, { clientId, dateRange }) });
    else issues.push({ sourceType: "tiktok", message: "TikTok is not connected or has no selected advertiser." });
  }
  if (includedChannels.includes("google")) {
    if (google?.accessToken && google.selectedCustomerId) fetchers.push({ sourceType: "google", request: () => fetchGoogleAdsPaidMediaRows({ accessToken: google.accessToken, customerId: google.selectedCustomerId!, loginCustomerId: google.loginCustomerId, clientId, since, until }) });
    else issues.push({ sourceType: "google", message: "Google Ads is not connected or has no selected customer." });
  }
  if (includedChannels.includes("snap")) {
    if (snap?.accessToken && snap.selectedAdAccountId) fetchers.push({ sourceType: "snap", request: () => fetchSnapPaidMediaRows({ accessToken: snap.accessToken, adAccountId: snap.selectedAdAccountId!, clientId, since, until }) });
    else issues.push({ sourceType: "snap", message: "Snapchat is not connected or has no selected ad account." });
  }
  const settled = await Promise.allSettled(
    fetchers.map((item) =>
      executePaidMediaSync({
        clientId: client.id,
        clientName: client.name,
        sourceType: item.sourceType,
        request: item.request,
      })
    )
  );
  const rows = settled.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    issues.push({ sourceType: fetchers[index].sourceType, message: result.reason instanceof Error ? result.reason.message : "Paid-media request failed." });
    return [];
  });
  return { client, dateRange, ...buildBlendedPaidMediaReport(rows, includedChannels), issues, implementationStatus: "implemented_awaiting_live_validation" as const };
}
