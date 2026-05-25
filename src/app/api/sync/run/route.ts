import { NextRequest, NextResponse } from "next/server";
import { META_ACCOUNT_COOKIE, META_TOKEN_COOKIE } from "@/lib/integrations/meta";
import { SHOPIFY_TOKEN_COOKIE } from "@/lib/integrations/shopify";
import { runMetaSync, runShopifySync, runWordPressSync } from "@/lib/syncEngine";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    platform?: "meta" | "shopify" | "wordpress";
  };

  if (body.platform === "meta") {
    const run = await runMetaSync({
      accessToken: request.cookies.get(META_TOKEN_COOKIE)?.value ?? null,
      accountId: request.cookies.get(META_ACCOUNT_COOKIE)?.value ?? null,
    });

    return NextResponse.json(run, {
      status: run.status === "succeeded" ? 200 : 400,
    });
  }

  if (body.platform === "shopify") {
    const run = await runShopifySync({
      accessToken: request.cookies.get(SHOPIFY_TOKEN_COOKIE)?.value ?? null,
    });

    return NextResponse.json(run, {
      status: run.status === "succeeded" ? 200 : 400,
    });
  }

  if (body.platform === "wordpress") {
    const run = await runWordPressSync();

    return NextResponse.json(run, {
      status: run.status === "succeeded" ? 200 : 400,
    });
  }

  return NextResponse.json(
    { error: "Platform must be meta, shopify, or wordpress." },
    { status: 400 }
  );
}
