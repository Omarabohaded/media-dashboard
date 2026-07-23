import { NextRequest, NextResponse } from "next/server";
import {
  fetchMetaAdAccounts,
} from "@/lib/integrations/meta";
import { getClientById, getMetaConnection, upsertMetaConnection } from "@/lib/clientStore";
import { requireClientIntegrationAccess } from "@/lib/serverAccess";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { accountId?: string; clientId?: string };
    const access = await requireClientIntegrationAccess(body.clientId);
    if (access.response) return access.response;
    const client = await getClientById(access.clientId);
    const connection = await getMetaConnection(client.id);
    const accessToken = connection?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Connect Meta before choosing an account." },
        { status: 401 }
      );
    }

    const accountId = body.accountId?.trim();

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required." },
        { status: 400 }
      );
    }

    const accounts = await fetchMetaAdAccounts(accessToken);
    const account = accounts.find((item) => item.id === accountId);

    if (!account) {
      return NextResponse.json(
        { error: "That Meta ad account is not available for this user." },
        { status: 404 }
      );
    }

    await upsertMetaConnection({
      clientId: client.id,
      accessToken,
      connectedAt: connection?.connectedAt ?? new Date().toISOString(),
      selectedAccountId: account.id,
      selectedAccountName: account.name,
      lastError: null,
    });

    return NextResponse.json({ ok: true, account, clientId: client.id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save the Meta ad account.",
      },
      { status: 500 }
    );
  }
}
