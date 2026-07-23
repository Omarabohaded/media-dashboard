export type SnapStats = Record<string, number | string | undefined>;
export function buildSnapStatsQuery(input: { purchasesEvent: string | null; purchaseValueEvent: string | null; since: string; until: string }) {
  const fields = [...new Set(["impressions", "swipes", "spend", input.purchasesEvent, input.purchaseValueEvent].filter(Boolean))];
  return new URLSearchParams({ granularity: "TOTAL", breakdown: "campaign", fields: fields.join(","), start_time: `${input.since}T00:00:00.000Z`, end_time: `${input.until}T00:00:00.000Z`, omit_empty: "true" });
}
export function normalizeSnapCampaignStats(rows: Array<{ id: string; name?: string; stats: SnapStats }>, input: {
  clientId: string; purchasesEvent: string | null; purchaseValueEvent: string | null;
  mappingStatus: "mapped" | "missing_mapping" | "missing_purchase_mapping" | "missing_purchase_value_mapping"; since: string; until: string;
}) {
  return rows.map((row) => ({
    sourceType: "snap" as const, channel: "snap" as const, clientId: input.clientId,
    spend: Number(row.stats.spend ?? 0) / 1_000_000, impressions: Number(row.stats.impressions ?? 0), clicks: Number(row.stats.swipes ?? 0),
    purchases: input.purchasesEvent ? Number(row.stats[input.purchasesEvent] ?? 0) : 0,
    purchaseValue: input.purchaseValueEvent ? Number(row.stats[input.purchaseValueEvent] ?? 0) / 1_000_000 : 0,
    dateRange: { since: input.since, until: input.until }, conversionMappingStatus: input.mappingStatus,
    purchasesEvent: input.purchasesEvent, purchaseValueEvent: input.purchaseValueEvent,
    sourceRecordId: row.id, sourceRecordName: row.name ?? row.id, rawMetadata: { stats: row.stats },
  }));
}
