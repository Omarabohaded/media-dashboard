export type PaidMediaSourceType = "meta" | "tiktok" | "google" | "snap";

export type PaidMediaDateRange = {
  datePreset?: string;
  since?: string;
  until?: string;
};

export type SourceConversionMappingStatus =
  | "mapped"
  | "missing_mapping"
  | "missing_purchase_mapping"
  | "missing_purchase_value_mapping";

export type SourceConversionEventRole = "purchases" | "purchaseValue";

export type DiscoveredSourceConversionEvent = {
  sourceType: PaidMediaSourceType;
  clientId: string | null;
  eventName: string;
  label: string;
  roles: SourceConversionEventRole[];
  firstSeenAt: string | null;
  lastSeenAt: string | null;
};

export type NormalizedPaidMediaRow = {
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchaseValue: number;
  sourceType: PaidMediaSourceType;
  channel: PaidMediaSourceType;
  clientId: string;
  dateRange: PaidMediaDateRange;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
  conversionMappingStatus: SourceConversionMappingStatus;
  purchasesEvent: string | null;
  purchaseValueEvent: string | null;
  sourceRecordId?: string | null;
  sourceRecordName?: string | null;
  rawMetadata?: Record<string, unknown>;
};

export function derivePaidMediaMetrics(input: {
  spend: number;
  impressions: number;
  clicks: number;
  purchaseValue: number;
}) {
  return {
    ctr: input.impressions > 0 ? (input.clicks / input.impressions) * 100 : undefined,
    cpc: input.clicks > 0 ? input.spend / input.clicks : undefined,
    cpm: input.impressions > 0 ? (input.spend / input.impressions) * 1000 : undefined,
    roas: input.spend > 0 ? input.purchaseValue / input.spend : undefined,
  };
}

export function summarizePaidMediaRows(rows: NormalizedPaidMediaRow[]) {
  const totals = rows.reduce(
    (sum, row) => ({
      spend: sum.spend + row.spend,
      impressions: sum.impressions + row.impressions,
      clicks: sum.clicks + row.clicks,
      purchases: sum.purchases + row.purchases,
      purchaseValue: sum.purchaseValue + row.purchaseValue,
    }),
    { spend: 0, impressions: 0, clicks: 0, purchases: 0, purchaseValue: 0 }
  );

  return {
    ...totals,
    ...derivePaidMediaMetrics(totals),
    mappingStatuses: [...new Set(rows.map((row) => row.conversionMappingStatus))],
  };
}

export type PaidMediaChannelSummary = ReturnType<typeof summarizePaidMediaRows> & {
  sourceType: PaidMediaSourceType;
};

export function buildBlendedPaidMediaReport(
  rows: NormalizedPaidMediaRow[],
  includedChannels: PaidMediaSourceType[] = ["meta", "google", "tiktok", "snap"]
) {
  const included = new Set(includedChannels);
  const includedRows = rows.filter((row) => included.has(row.channel));
  const sourceTypes = [...new Set(rows.map((row) => row.sourceType))];
  const channels = sourceTypes.map<PaidMediaChannelSummary>((sourceType) => ({
    sourceType,
    ...summarizePaidMediaRows(rows.filter((row) => row.sourceType === sourceType)),
  }));

  return {
    rows: includedRows,
    channels,
    blended: summarizePaidMediaRows(includedRows),
    includedChannels,
  };
}
