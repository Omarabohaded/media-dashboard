import { NextRequest, NextResponse } from "next/server";

export const visibleClient = {
  id: "client-visible",
  name: "Visible Client",
  websitePlatform: "shopify",
  currencyCode: "AED",
};

export function request(
  path: string,
  init?: RequestInit
) {
  return new NextRequest(
    `https://dashboard.test${path}`,
    init as ConstructorParameters<typeof NextRequest>[1]
  );
}

export function denied(status = 401, error = "Authentication required.") {
  return {
    response: NextResponse.json({ error }, { status }),
    user: null,
    clientId: "",
  };
}

export function allowed(clientId = visibleClient.id) {
  return {
    response: null,
    user: { id: "owner-1", email: "owner@example.test", role: "owner" },
    clientId,
  };
}

export async function body(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

export function expectNoSecrets(payload: unknown) {
  const serialized = JSON.stringify(payload);
  for (const secret of [
    "access-token-secret",
    "refresh-token-secret",
    "client-secret-value",
  ]) {
    if (serialized.includes(secret)) {
      throw new Error(`Response leaked secret: ${secret}`);
    }
  }
}
