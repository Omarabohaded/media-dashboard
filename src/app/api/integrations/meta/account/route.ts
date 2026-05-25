import { NextRequest, NextResponse } from "next/server";
import {
  fetchMetaAdAccounts,
  getSecureCookieFlag,
  META_ACCOUNT_COOKIE,
  META_TOKEN_COOKIE,
} from "@/lib/integrations/meta";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(META_TOKEN_COOKIE)?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Connect Meta before choosing an account." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { accountId?: string };
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

    const response = NextResponse.json({ ok: true, account });
    response.cookies.set(META_ACCOUNT_COOKIE, account.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: getSecureCookieFlag(),
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
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
