import { NextRequest, NextResponse } from "next/server";
import {
  buildMetricAdminOverride,
  getMetricRegistry,
  getMetricRegistryEntry,
  getMetricRegistrySummary,
  type MetricBenchmarkDirection,
  type MetricChannel,
  type MetricDenominatorChoice,
  type MetricRevenueBasis,
} from "@/lib/metricRegistry";
import {
  clearMetricOverride,
  getMetricOverrideStoreMeta,
  listMetricOverrides,
  upsertMetricOverride,
} from "@/lib/metricOverrideStore";
import { requireAdminAccess } from "@/lib/serverAccess";

const ALLOWED_REVENUE_BASIS = new Set<MetricRevenueBasis>([
  "gross_sales",
  "net_sales",
  "platform_purchase_value",
]);
const ALLOWED_DENOMINATORS = new Set<MetricDenominatorChoice>([
  "orders",
  "purchases",
  "new_customers",
  "sessions",
  "clicks",
  "begin_checkout",
  "add_to_cart",
]);
const ALLOWED_CHANNELS = new Set<MetricChannel>([
  "meta",
  "google",
  "tiktok",
  "snap",
]);
const ALLOWED_BENCHMARK_DIRECTIONS = new Set<MetricBenchmarkDirection>([
  "higher_is_better",
  "lower_is_better",
]);

export async function GET() {
  const access = await requireAdminAccess();
  if (access.response) return access.response;
  const overrides = await listMetricOverrides();
  const entries = getMetricRegistry(overrides);

  return NextResponse.json({
    entries,
    summary: getMetricRegistrySummary(entries),
    storage: getMetricOverrideStoreMeta(),
  });
}

export async function PATCH(request: NextRequest) {
  const access = await requireAdminAccess();
  if (access.response) return access.response;
  const body = (await request.json().catch(() => ({}))) as {
    metricId?: string;
    revenueBasis?: MetricRevenueBasis | null;
    denominatorChoice?: MetricDenominatorChoice | null;
    includedChannels?: MetricChannel[];
    benchmarkDirection?: MetricBenchmarkDirection | null;
    benchmarkGood?: number | null;
    benchmarkWatch?: number | null;
    benchmarkRisk?: number | null;
    adminNotes?: string | null;
  };

  const metricId = body.metricId?.trim() ?? "";

  if (!metricId) {
    return NextResponse.json({ error: "Metric ID is required." }, { status: 400 });
  }

  const currentEntry = getMetricRegistryEntry(metricId);

  if (!currentEntry) {
    return NextResponse.json({ error: "Metric was not found." }, { status: 404 });
  }

  if (currentEntry.editability !== "controlled_mapping") {
    return NextResponse.json(
      { error: "This metric is not available for admin editing." },
      { status: 400 }
    );
  }

  const normalizedOverride = buildMetricAdminOverride(metricId);

  normalizedOverride.revenueBasis =
    typeof body.revenueBasis === "string" && ALLOWED_REVENUE_BASIS.has(body.revenueBasis)
      ? body.revenueBasis
      : null;

  normalizedOverride.denominatorChoice =
    typeof body.denominatorChoice === "string" &&
    ALLOWED_DENOMINATORS.has(body.denominatorChoice)
      ? body.denominatorChoice
      : null;

  normalizedOverride.includedChannels = Array.isArray(body.includedChannels)
    ? body.includedChannels.filter(
        (channel): channel is MetricChannel => ALLOWED_CHANNELS.has(channel)
      )
    : [];

  normalizedOverride.benchmarkDirection =
    typeof body.benchmarkDirection === "string" &&
    ALLOWED_BENCHMARK_DIRECTIONS.has(body.benchmarkDirection)
      ? body.benchmarkDirection
      : null;

  normalizedOverride.benchmarkGood = parseNumericOverride(body.benchmarkGood);
  normalizedOverride.benchmarkWatch = parseNumericOverride(body.benchmarkWatch);
  normalizedOverride.benchmarkRisk = parseNumericOverride(body.benchmarkRisk);
  normalizedOverride.adminNotes = body.adminNotes?.trim() || null;

  const allowedRevenueBasis = new Set(
    currentEntry.controlOptions.revenueBasisOptions.map((option) => option.value)
  );
  const allowedDenominators = new Set(
    currentEntry.controlOptions.denominatorOptions.map((option) => option.value)
  );
  const allowedChannels = new Set(
    currentEntry.controlOptions.channelOptions.map((option) => option.value)
  );

  if (
    normalizedOverride.revenueBasis &&
    !allowedRevenueBasis.has(normalizedOverride.revenueBasis)
  ) {
    return NextResponse.json(
      { error: "This metric does not support that revenue basis override." },
      { status: 400 }
    );
  }

  if (
    normalizedOverride.denominatorChoice &&
    !allowedDenominators.has(normalizedOverride.denominatorChoice)
  ) {
    return NextResponse.json(
      { error: "This metric does not support that denominator choice." },
      { status: 400 }
    );
  }

  if (
    normalizedOverride.includedChannels.some(
      (channel) => !allowedChannels.has(channel)
    )
  ) {
    return NextResponse.json(
      { error: "This metric does not support channel inclusion overrides." },
      { status: 400 }
    );
  }

  const override = await upsertMetricOverride(normalizedOverride);
  const entries = getMetricRegistry(await listMetricOverrides());

  return NextResponse.json({
    override,
    entry: entries.find((entry) => entry.id === metricId) ?? null,
    summary: getMetricRegistrySummary(entries),
  });
}

export async function DELETE(request: NextRequest) {
  const access = await requireAdminAccess();
  if (access.response) return access.response;
  const metricId = request.nextUrl.searchParams.get("metricId")?.trim() ?? "";

  if (!metricId) {
    return NextResponse.json({ error: "Metric ID is required." }, { status: 400 });
  }

  await clearMetricOverride(metricId);
  const entries = getMetricRegistry(await listMetricOverrides());

  return NextResponse.json({
    ok: true,
    entry: entries.find((entry) => entry.id === metricId) ?? null,
    summary: getMetricRegistrySummary(entries),
  });
}

function parseNumericOverride(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
