import { NextResponse } from "next/server";
import {
  buildDashboardMetricLogic,
  DEFAULT_DASHBOARD_METRIC_LOGIC,
} from "@/lib/dashboardMetricLogic";
import { listMetricMappings } from "@/lib/metricMappingStore";
import { listMetricOverrides } from "@/lib/metricOverrideStore";

export async function GET() {
  try {
    const [overrides, mappings] = await Promise.all([
      listMetricOverrides(),
      listMetricMappings(),
    ]);

    return NextResponse.json({
      metricLogic: buildDashboardMetricLogic(overrides, mappings),
    });
  } catch {
    return NextResponse.json({
      metricLogic: DEFAULT_DASHBOARD_METRIC_LOGIC,
    });
  }
}
