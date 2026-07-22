export type TikTokReportRow = {
  dimensions?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  [key: string]: unknown;
};

export type TikTokReportEvent = {
  eventName: string;
  label: string;
  roles: Array<"purchases" | "purchaseValue">;
  raw: unknown;
};

const EVENT_METRICS = [
  { eventName: "conversion", label: "Conversions", roles: ["purchases"] },
  { eventName: "conversion_value", label: "Conversion value", roles: ["purchaseValue"] },
] as const;

export function buildTikTokEventDiscoveryQuery(input: {
  advertiserId: string;
  startDate: string;
  endDate: string;
}) {
  return {
    advertiser_id: input.advertiserId,
    report_type: "BASIC",
    data_level: "AUCTION_CAMPAIGN",
    dimensions: ["campaign_id"],
    metrics: ["spend", "impressions", "clicks", "conversion", "conversion_value"],
    start_date: input.startDate,
    end_date: input.endDate,
    page: 1,
    page_size: 100,
  } as const;
}

export function buildTikTokPaidMediaQuery(input: {
  advertiserId: string;
  startDate: string;
  endDate: string;
  purchasesEvent: string | null;
  purchaseValueEvent: string | null;
  page?: number;
  pageSize?: number;
}) {
  const metrics = [
    "spend",
    "impressions",
    "clicks",
    input.purchasesEvent,
    input.purchaseValueEvent,
  ].filter((metric, index, all): metric is string => Boolean(metric) && all.indexOf(metric) === index);

  return {
    advertiser_id: input.advertiserId,
    report_type: "BASIC",
    data_level: "AUCTION_CAMPAIGN",
    dimensions: ["campaign_id"],
    metrics,
    start_date: input.startDate,
    end_date: input.endDate,
    page: input.page ?? 1,
    page_size: input.pageSize ?? 1000,
  } as const;
}

export function extractTikTokReportEvents(rows: TikTokReportRow[]): TikTokReportEvent[] {
  return EVENT_METRICS.filter(({ eventName }) =>
    rows.some((row) => Object.prototype.hasOwnProperty.call(row.metrics ?? {}, eventName))
  ).map((event) => ({
    ...event,
    roles: [...event.roles],
    raw: rows.map((row) => row.metrics?.[event.eventName]).filter((value) => value !== undefined),
  }));
}

function finiteNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function extractTikTokMappedMetrics(
  row: TikTokReportRow,
  mapping: { purchasesEvent: string | null; purchaseValueEvent: string | null }
) {
  const metrics = row.metrics ?? {};
  return {
    spend: finiteNumber(metrics.spend),
    impressions: finiteNumber(metrics.impressions),
    clicks: finiteNumber(metrics.clicks),
    purchases: mapping.purchasesEvent ? finiteNumber(metrics[mapping.purchasesEvent]) : 0,
    purchaseValue: mapping.purchaseValueEvent
      ? finiteNumber(metrics[mapping.purchaseValueEvent])
      : 0,
  };
}
