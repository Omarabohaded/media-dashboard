import { NextRequest, NextResponse } from "next/server";
import { buildClientPaidMediaReport } from "@/lib/paidMediaReportingService";
import { requireClientAccess } from "@/lib/serverAccess";
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("clientId");
  const access = await requireClientAccess(clientId);
  if (access.response) return access.response;
  try {
    return NextResponse.json(await buildClientPaidMediaReport(access.clientId, {
      datePreset: request.nextUrl.searchParams.get("datePreset") ?? undefined,
      since: request.nextUrl.searchParams.get("since") ?? undefined,
      until: request.nextUrl.searchParams.get("until") ?? undefined,
    }));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load paid-media reporting." }, { status: 500 }); }
}
