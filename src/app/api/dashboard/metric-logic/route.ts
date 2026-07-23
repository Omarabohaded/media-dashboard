import { NextRequest, NextResponse } from "next/server";
import {
  buildDashboardMetricLogic,
  DEFAULT_DASHBOARD_METRIC_LOGIC,
} from "@/lib/dashboardMetricLogic";
import { listMetricMappings } from "@/lib/metricMappingStore";
import { listMetricOverrides } from "@/lib/metricOverrideStore";
import { requireClientAccess } from "@/lib/serverAccess";

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get("clientId");
    const access = await requireClientAccess(clientId);
    if (access.response) return access.response;

    const [overrides, mappings] = await Promise.all([
      listMetricOverrides(),
      listMetricMappings(),
    ]);

    return NextResponse.json({
      metricLogic: buildDashboardMetricLogic(overrides, mappings, {
        clientId: access.clientId,
      }),
    });
  } catch {
    return NextResponse.json({
      metricLogic: DEFAULT_DASHBOARD_METRIC_LOGIC,
    });
  }
}
