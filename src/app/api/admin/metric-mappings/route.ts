import { NextRequest, NextResponse } from "next/server";
import { getMetricRegistry, getMetricRegistrySummary } from "@/lib/metricRegistry";
import {
  buildDefaultMetricMapping,
  clearMetricMapping,
  getMetricMappingStoreMeta,
  listMetricMappings,
  upsertMetricMapping,
  type MetricFormulaTemplate,
  type MetricMappingAggregation,
  type MetricMappingFilterPreset,
  type MetricMappingScope,
  type MetricMappingSourceField,
  type MetricMappingSourceType,
} from "@/lib/metricMappingStore";
import { requireAdminAccess } from "@/lib/serverAccess";

const ALLOWED_SOURCE_TYPES = new Set<MetricMappingSourceType>([
  "woocommerce",
  "shopify",
  "meta",
  "google",
  "tiktok",
  "snap",
  "calculated",
  "manual",
  "not_connected",
]);

const ALLOWED_SOURCE_FIELDS = new Set<MetricMappingSourceField>([
  "grossSales",
  "netSales",
  "ordersCount",
  "averageOrderValue",
  "taxTotal",
  "shippingTotal",
  "totalAdSpend",
  "platformPurchaseValue",
  "purchases",
  "clicks",
  "impressions",
  "ctr",
  "cpc",
  "cpm",
  "frequency",
  "reach",
  "addToCart",
  "checkoutInitiated",
  "newCustomers",
  "sessions",
  "none",
]);

const ALLOWED_AGGREGATIONS = new Set<MetricMappingAggregation>([
  "sum",
  "count",
  "average",
  "ratio",
  "rule",
  "none",
]);

const ALLOWED_FILTERS = new Set<MetricMappingFilterPreset>([
  "completed_orders",
  "paid_orders",
  "all_orders",
  "active_campaigns",
  "selected_reporting_window",
  "none",
]);

const ALLOWED_FORMULAS = new Set<MetricFormulaTemplate>([
  "none",
  "revenue_divide_spend",
  "revenue_divide_orders",
  "spend_divide_orders",
  "spend_divide_purchases",
  "platform_value_divide_spend",
  "clicks_divide_impressions",
  "spend_divide_clicks",
  "spend_divide_impressions_times_1000",
  "purchases_divide_clicks",
  "checkout_divide_add_to_cart",
  "store_vs_platform_gap",
]);

const DEVELOPER_MANAGED_FORMULAS = new Set<MetricFormulaTemplate>([
  "store_vs_platform_gap",
]);

function normalizeValue<T extends string>(value: unknown, allowed: Set<T>, fallback: T) {
  return typeof value === "string" && allowed.has(value as T) ? (value as T) : fallback;
}

function isFormulaAllowedForMetric(editability: string, formulaTemplate: MetricFormulaTemplate) {
  if (DEVELOPER_MANAGED_FORMULAS.has(formulaTemplate)) {
    return editability === "developer_managed";
  }

  return editability === "controlled_mapping" || formulaTemplate === "none";
}

export async function GET() {
  const access = await requireAdminAccess();
  if (access.response) return access.response;

  const registry = getMetricRegistry();
  const mappings = await listMetricMappings();
  const mappingByKey = new Map(
    mappings.map((mapping) => [
      `${mapping.metricId}:${mapping.scope}:${mapping.scope === "client" ? mapping.clientId ?? "" : "global"}`,
      mapping,
    ])
  );

  const entries = registry.map((metric) => {
    const globalMapping = mappingByKey.get(`${metric.id}:global:global`) ?? null;
    return {
      metric,
      mapping: globalMapping ?? buildDefaultMetricMapping(metric.id),
      hasSavedMapping: Boolean(globalMapping),
      canEditMapping: metric.editability === "controlled_mapping",
    };
  });

  return NextResponse.json({
    entries,
    summary: getMetricRegistrySummary(registry),
    storage: getMetricMappingStoreMeta(),
  });
}

export async function PATCH(request: NextRequest) {
  const access = await requireAdminAccess();
  if (access.response) return access.response;

  const body = (await request.json().catch(() => ({}))) as {
    metricId?: string;
    scope?: MetricMappingScope;
    clientId?: string | null;
    sourceType?: MetricMappingSourceType;
    sourceField?: MetricMappingSourceField;
    aggregation?: MetricMappingAggregation;
    filterPreset?: MetricMappingFilterPreset;
    formulaTemplate?: MetricFormulaTemplate;
    enabled?: boolean;
    adminNotes?: string | null;
  };

  const metricId = body.metricId?.trim() ?? "";
  const metric = getMetricRegistry().find((entry) => entry.id === metricId) ?? null;

  if (!metric) {
    return NextResponse.json({ error: "Metric was not found." }, { status: 404 });
  }

  if (metric.editability !== "controlled_mapping") {
    return NextResponse.json(
      { error: "This metric is protected. You can inspect it, but mapping edits are not allowed." },
      { status: 400 }
    );
  }

  const sourceType = normalizeValue(body.sourceType, ALLOWED_SOURCE_TYPES, "not_connected");
  const sourceField = normalizeValue(body.sourceField, ALLOWED_SOURCE_FIELDS, "none");
  const aggregation = normalizeValue(body.aggregation, ALLOWED_AGGREGATIONS, "none");
  const filterPreset = normalizeValue(body.filterPreset, ALLOWED_FILTERS, "selected_reporting_window");
  const formulaTemplate = normalizeValue(body.formulaTemplate, ALLOWED_FORMULAS, "none");

  if (!isFormulaAllowedForMetric(metric.editability, formulaTemplate)) {
    return NextResponse.json(
      { error: "This formula template is not allowed for this metric." },
      { status: 400 }
    );
  }

  const scope: MetricMappingScope = body.scope === "client" ? "client" : "global";
  const mapping = await upsertMetricMapping({
    metricId,
    scope,
    clientId: scope === "client" ? body.clientId?.trim() || null : null,
    sourceType,
    sourceField,
    aggregation,
    filterPreset,
    formulaTemplate,
    enabled: body.enabled !== false,
    adminNotes: body.adminNotes?.trim() || null,
  });

  const registry = getMetricRegistry();
  const mappings = await listMetricMappings();

  return NextResponse.json({
    mapping,
    entries: registry.map((entry) => {
      const savedMapping = mappings.find(
        (item) => item.metricId === entry.id && item.scope === "global"
      );
      return {
        metric: entry,
        mapping: savedMapping ?? buildDefaultMetricMapping(entry.id),
        hasSavedMapping: Boolean(savedMapping),
        canEditMapping: entry.editability === "controlled_mapping",
      };
    }),
    summary: getMetricRegistrySummary(registry),
  });
}

export async function DELETE(request: NextRequest) {
  const access = await requireAdminAccess();
  if (access.response) return access.response;

  const metricId = request.nextUrl.searchParams.get("metricId")?.trim() ?? "";
  const scope = request.nextUrl.searchParams.get("scope") === "client" ? "client" : "global";
  const clientId = request.nextUrl.searchParams.get("clientId")?.trim() || null;

  if (!metricId) {
    return NextResponse.json({ error: "Metric ID is required." }, { status: 400 });
  }

  await clearMetricMapping(metricId, scope, clientId);

  const registry = getMetricRegistry();
  const mappings = await listMetricMappings();

  return NextResponse.json({
    ok: true,
    entries: registry.map((entry) => {
      const savedMapping = mappings.find(
        (item) => item.metricId === entry.id && item.scope === "global"
      );
      return {
        metric: entry,
        mapping: savedMapping ?? buildDefaultMetricMapping(entry.id),
        hasSavedMapping: Boolean(savedMapping),
        canEditMapping: entry.editability === "controlled_mapping",
      };
    }),
    summary: getMetricRegistrySummary(registry),
  });
}
