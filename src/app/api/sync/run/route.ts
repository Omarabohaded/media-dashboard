import { NextRequest, NextResponse } from "next/server";
import { runMetaSync, runShopifySync, runWordPressSync } from "@/lib/syncEngine";
import { getClientById, getMetaConnection } from "@/lib/clientStore";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    platform?: "meta" | "shopify" | "wordpress";
    clientId?: string;
  };

  if (body.platform === "meta") {
    const client = await getClientById(body.clientId);
    const connection = await getMetaConnection(client.id);
    const run = await runMetaSync({
      clientId: client.id,
      accessToken: connection?.accessToken ?? null,
      accountId: connection?.selectedAccountId ?? null,
    });

    return NextResponse.json(run, {
      status: run.status === "succeeded" ? 200 : 400,
    });
  }

  if (body.platform === "shopify") {
    const client = await getClientById(body.clientId);
    const run = await runShopifySync({
      clientId: client.id,
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
