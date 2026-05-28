import {
  getRuntimeStorageMeta,
  readRuntimeJsonStore,
  writeRuntimeJsonStore,
} from "@/lib/runtimeStorage";
import type {
  MetricAdminOverride,
  MetricBenchmarkDirection,
  MetricChannel,
  MetricDenominatorChoice,
  MetricRevenueBasis,
} from "@/lib/metricRegistry";

type MetricOverrideState = {
  version: 1;
  updatedAt: string | null;
  overrides: MetricAdminOverride[];
};

const METRIC_OVERRIDE_STORE_KEY = "media-dashboard:metric-overrides";
const METRIC_OVERRIDE_STORE_FILE = "metric-overrides.json";

function defaultState(): MetricOverrideState {
  return {
    version: 1,
    updatedAt: null,
    overrides: [],
  };
}

function normalizeMetricOverride(
  override: MetricAdminOverride
): MetricAdminOverride {
  return {
    metricId: override.metricId,
    revenueBasis: override.revenueBasis ?? null,
    denominatorChoice: override.denominatorChoice ?? null,
    includedChannels: [...(override.includedChannels ?? [])].sort() as MetricChannel[],
    benchmarkDirection: override.benchmarkDirection ?? null,
    benchmarkGood: override.benchmarkGood ?? null,
    benchmarkWatch: override.benchmarkWatch ?? null,
    benchmarkRisk: override.benchmarkRisk ?? null,
    adminNotes: override.adminNotes?.trim() || null,
    updatedAt: override.updatedAt ?? null,
  };
}

function hasMeaningfulOverride(override: MetricAdminOverride) {
  return Boolean(
    override.revenueBasis ||
      override.denominatorChoice ||
      override.includedChannels?.length ||
      override.benchmarkDirection ||
      override.benchmarkGood !== null ||
      override.benchmarkWatch !== null ||
      override.benchmarkRisk !== null ||
      override.adminNotes
  );
}

export async function readMetricOverrideStore(): Promise<MetricOverrideState> {
  const parsed = await readRuntimeJsonStore<MetricOverrideState>(
    METRIC_OVERRIDE_STORE_KEY,
    METRIC_OVERRIDE_STORE_FILE,
    defaultState()
  );

  return {
    ...defaultState(),
    ...parsed,
    overrides: (parsed.overrides ?? []).map((override) =>
      normalizeMetricOverride(override)
    ),
  };
}

async function updateMetricOverrideStore(
  updater: (state: MetricOverrideState) => MetricOverrideState
) {
  const current = await readMetricOverrideStore();
  const next = updater(current);
  next.updatedAt = new Date().toISOString();
  await writeRuntimeJsonStore(
    METRIC_OVERRIDE_STORE_KEY,
    METRIC_OVERRIDE_STORE_FILE,
    next
  );
  return next;
}

export function getMetricOverrideStoreMeta() {
  return getRuntimeStorageMeta(METRIC_OVERRIDE_STORE_FILE);
}

export async function listMetricOverrides() {
  const state = await readMetricOverrideStore();
  return state.overrides;
}

export async function getMetricOverride(metricId: string) {
  const state = await readMetricOverrideStore();
  return state.overrides.find((override) => override.metricId === metricId) ?? null;
}

export async function upsertMetricOverride(
  override: Omit<MetricAdminOverride, "updatedAt">
) {
  const normalized = normalizeMetricOverride({
    ...override,
    updatedAt: new Date().toISOString(),
  });

  const nextState = await updateMetricOverrideStore((state) => {
    const filtered = state.overrides.filter(
      (item) => item.metricId !== normalized.metricId
    );

    return {
      ...state,
      overrides: hasMeaningfulOverride(normalized)
        ? [normalized, ...filtered]
        : filtered,
    };
  });

  return (
    nextState.overrides.find((item) => item.metricId === normalized.metricId) ??
    null
  );
}

export async function clearMetricOverride(metricId: string) {
  await updateMetricOverrideStore((state) => ({
    ...state,
    overrides: state.overrides.filter((override) => override.metricId !== metricId),
  }));
}

export function buildEmptyMetricOverride(metricId: string): MetricAdminOverride {
  return {
    metricId,
    revenueBasis: null,
    denominatorChoice: null,
    includedChannels: [],
    benchmarkDirection: null,
    benchmarkGood: null,
    benchmarkWatch: null,
    benchmarkRisk: null,
    adminNotes: null,
    updatedAt: null,
  };
}
