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

export function extractTikTokReportEvents(rows: TikTokReportRow[]): TikTokReportEvent[] {
  return EVENT_METRICS.filter(({ eventName }) =>
    rows.some((row) => Object.prototype.hasOwnProperty.call(row.metrics ?? {}, eventName))
  ).map((event) => ({
    ...event,
    roles: [...event.roles],
    raw: rows.map((row) => row.metrics?.[event.eventName]).filter((value) => value !== undefined),
  }));
}
