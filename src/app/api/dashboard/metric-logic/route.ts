import { NextResponse } from "next/server";
import {
  buildDashboardMetricLogic,
  DEFAULT_DASHBOARD_METRIC_LOGIC,
} from "@/lib/dashboardMetricLogic";
import { listMetricOverrides } from "@/lib/metricOverrideStore";

export async function GET() {
  try {
    const overrides = await listMetricOverrides();

    return NextResponse.json({
      metricLogic: buildDashboardMetricLogic(overrides),
    });
  } catch {
    return NextResponse.json({
      metricLogic: DEFAULT_DASHBOARD_METRIC_LOGIC,
    });
  }
}
