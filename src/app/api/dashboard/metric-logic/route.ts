import { NextRequest, NextResponse } from "next/server";
import {
  buildDashboardMetricLogic,
  DEFAULT_DASHBOARD_METRIC_LOGIC,
} from "@/lib/dashboardMetricLogic";
import { listMetricMappings } from "@/lib/metricMappingStore";
import { listMetricOverrides } from "@/lib/metricOverrideStore";

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get("clientId");

    const [overrides, mappings] = await Promise.all([
      listMetricOverrides(),
      listMetricMappings(),
    ]);

    return NextResponse.json({
      metricLogic: buildDashboardMetricLogic(overrides, mappings, {
        clientId,
      }),
    });
  } catch {
    return NextResponse.json({
      metricLogic: DEFAULT_DASHBOARD_METRIC_LOGIC,
    });
  }
}
