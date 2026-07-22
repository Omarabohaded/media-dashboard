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
