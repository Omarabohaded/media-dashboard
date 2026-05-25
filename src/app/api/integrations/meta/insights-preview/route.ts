import { NextRequest, NextResponse } from "next/server";
import {
  fetchMetaInsightsPreview,
  META_ACCOUNT_COOKIE,
  META_TOKEN_COOKIE,
} from "@/lib/integrations/meta";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(META_TOKEN_COOKIE)?.value;
    const accountId = request.cookies.get(META_ACCOUNT_COOKIE)?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Connect Meta before loading preview data." },
        { status: 401 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Select an ad account before loading preview data." },
        { status: 400 }
      );
    }

    const rows = await fetchMetaInsightsPreview(accessToken, accountId);
    const totals = rows.reduce(
      (acc, row) => {
        acc.spend += row.spend;
        acc.purchases += row.purchases;
        acc.purchaseValue += row.purchaseValue;
        acc.impressions += row.impressions;
        acc.clicks += row.clicks;
        return acc;
      },
      {
        spend: 0,
        purchases: 0,
        purchaseValue: 0,
        impressions: 0,
        clicks: 0,
      }
    );

    return NextResponse.json({
      accountId,
      rows,
      totals,
      note:
        "This is a live Meta preview only. Do not enable scale recommendations until it is compared against store truth.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load Meta preview data.",
      },
      { status: 500 }
    );
  }
}
