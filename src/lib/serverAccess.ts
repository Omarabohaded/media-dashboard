import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById } from "@/lib/accessStore";
import {
  canAccessAdmin,
  canAccessClient,
  canManageClient,
  canManageClients,
  canManageIntegrations,
  canManageUsers,
  isOwnerOrAdmin,
} from "@/lib/accessControl";
import { type DashboardUser } from "@/lib/accessTypes";

export async function getAuthenticatedDashboardUser(): Promise<DashboardUser | null> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return null;
  }

  return getUserById(userId);
}

export function forbiddenResponse(message = "You do not have permission to perform this action.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorizedResponse(message = "Sign in is required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedDashboardUser();

  if (!user || user.status === "deactivated") {
    return { user: null, response: unauthorizedResponse() };
  }

  return { user, response: null };
}

export async function requireAdminAccess() {
  const { user, response } = await requireAuthenticatedUser();

  if (response) {
    return { user: null, response };
  }

  if (!canAccessAdmin(user)) {
    return { user: null, response: forbiddenResponse() };
  }

  return { user, response: null };
}

export async function requireUserManagementAccess() {
  const { user, response } = await requireAuthenticatedUser();

  if (response) {
    return { user: null, response };
  }

  if (!canManageUsers(user)) {
    return { user: null, response: forbiddenResponse() };
  }

  return { user, response: null };
}

export async function requireClientManagementAccess() {
  const { user, response } = await requireAuthenticatedUser();

  if (response) {
    return { user: null, response };
  }

  if (!canManageClients(user)) {
    return { user: null, response: forbiddenResponse() };
  }

  return { user, response: null };
}

export async function requireClientAccess(clientId: string | null | undefined) {
  const { user, response } = await requireAuthenticatedUser();

  if (response) {
    return { user: null, response };
  }

  const normalizedClientId = clientId?.trim();
  if (!normalizedClientId) {
    return {
      user: null,
      response: NextResponse.json({ error: "A client ID is required." }, { status: 400 }),
    };
  }

  if (!(await canAccessClient(user, normalizedClientId))) {
    return { user: null, response: forbiddenResponse("You cannot access this client.") };
  }

  return { user, clientId: normalizedClientId, response: null };
}

export async function requireClientIntegrationAccess(clientId: string | null | undefined) {
  const access = await requireClientAccess(clientId);
  if (access.response) return access;

  if (!canManageIntegrations(access.user) && !(await canManageClient(access.user, access.clientId))) {
    return {
      user: null,
      response: forbiddenResponse("You cannot manage integrations for this client."),
    };
  }

  return access;
}

export function hasPortfolioAccess(user: DashboardUser | null | undefined) {
  return isOwnerOrAdmin(user);
}
