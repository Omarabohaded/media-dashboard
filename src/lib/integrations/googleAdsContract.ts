export type GoogleAdsRow = {
  campaign?: { id?: string | number; name?: string };
  metrics?: Record<string, string | number | undefined>;
  segments?: { conversionAction?: string };
};

export function buildGoogleAdsCampaignQuery(input: {
  purchasesAction: string | null;
  purchaseValueAction: string | null;
  since: string;
  until: string;
}) {
  const actions = [...new Set([input.purchasesAction, input.purchaseValueAction].filter(Boolean))];
  const conversionFilter = actions.length
    ? ` AND segments.conversion_action IN (${actions.map((item) => `'${String(item).replaceAll("'", "\\'")}'`).join(", ")})`
    : "";
  return `SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value, segments.conversion_action FROM campaign WHERE segments.date BETWEEN '${input.since}' AND '${input.until}'${conversionFilter} ORDER BY campaign.id`;
}

export function normalizeGoogleAdsRows(
  rows: GoogleAdsRow[],
  input: {
    clientId: string;
    purchasesAction: string | null;
    purchaseValueAction: string | null;
    mappingStatus: "mapped" | "missing_mapping" | "missing_purchase_mapping" | "missing_purchase_value_mapping";
    since: string;
    until: string;
  }
) {
  const campaigns = new Map<string, GoogleAdsRow[]>();
  for (const row of rows) {
    const id = String(row.campaign?.id ?? "unknown");
    campaigns.set(id, [...(campaigns.get(id) ?? []), row]);
  }
  return [...campaigns.entries()].map(([id, grouped]) => {
    const base = grouped[0];
    const costMicros = Number(base.metrics?.costMicros ?? base.metrics?.cost_micros ?? 0);
    const actionOf = (row: GoogleAdsRow) => String(row.segments?.conversionAction ?? "");
    const purchases = input.purchasesAction
      ? grouped.filter((row) => actionOf(row) === input.purchasesAction).reduce((sum, row) => sum + Number(row.metrics?.conversions ?? 0), 0)
      : 0;
    const purchaseValue = input.purchaseValueAction
      ? grouped.filter((row) => actionOf(row) === input.purchaseValueAction).reduce((sum, row) => sum + Number(row.metrics?.conversionsValue ?? row.metrics?.conversions_value ?? 0), 0)
      : 0;
    return {
      sourceType: "google" as const,
      channel: "google" as const,
      clientId: input.clientId,
      spend: costMicros / 1_000_000,
      impressions: Number(base.metrics?.impressions ?? 0),
      clicks: Number(base.metrics?.clicks ?? 0),
      purchases,
      purchaseValue,
      dateRange: { since: input.since, until: input.until },
      conversionMappingStatus: input.mappingStatus,
      purchasesEvent: input.purchasesAction,
      purchaseValueEvent: input.purchaseValueAction,
      sourceRecordId: id,
      sourceRecordName: base.campaign?.name ?? id,
      rawMetadata: { rows: grouped },
    };
  });
}
