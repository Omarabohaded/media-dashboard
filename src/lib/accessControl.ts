import { type ClientRecord } from "@/lib/clientTypes";
import {
  getAssignedClientIds,
  getUserByEmail,
  getUserById,
  listAssignments,
  readAccessStore,
} from "@/lib/accessStore";
import { type DashboardUser } from "@/lib/accessTypes";
import {
  canAccessClientWithAssignments,
  canManageClientsByRole,
} from "@/lib/authorizationPolicy";

export { canAccessClientWithAssignments } from "@/lib/authorizationPolicy";

export function isOwner(user: DashboardUser | null | undefined) {
  return user?.role === "owner" && user.status !== "deactivated";
}

export function isAdmin(user: DashboardUser | null | undefined) {
  return user?.role === "admin" && user.status !== "deactivated";
}

export function isOwnerOrAdmin(user: DashboardUser | null | undefined) {
  return isOwner(user) || isAdmin(user);
}

export function canAccessAdmin(user: DashboardUser | null | undefined) {
  return isOwnerOrAdmin(user);
}

export function canManageUsers(user: DashboardUser | null | undefined) {
  return isOwnerOrAdmin(user);
}

export function canManageIntegrations(user: DashboardUser | null | undefined) {
  return isOwnerOrAdmin(user);
}

export function canManageClients(user: DashboardUser | null | undefined) {
  return canManageClientsByRole(user);
}

export function canAccessPortfolio(user: DashboardUser | null | undefined) {
  return isOwnerOrAdmin(user);
}

export async function canAccessClient(user: DashboardUser | null | undefined, clientId: string) {
  if (!user || user.status === "deactivated") return false;
  if (isOwnerOrAdmin(user)) return true;
  const assignedClientIds = await getAssignedClientIds(user.id);
  return canAccessClientWithAssignments(user, clientId, assignedClientIds);
}

export async function canManageClient(user: DashboardUser | null | undefined, clientId: string) {
  if (!user || user.status === "deactivated") {
    return false;
  }

  if (isOwnerOrAdmin(user)) {
    return true;
  }

  const assignments = await listAssignments();
  return assignments.some(
    (assignment) =>
      assignment.userId === user.id &&
      assignment.clientId === clientId &&
      (assignment.accessLevel === "manage" || assignment.accessLevel === "admin")
  );
}

export async function getVisibleClientsForUser(
  user: DashboardUser | null | undefined,
  clients: ClientRecord[]
) {
  if (!user || user.status === "deactivated") {
    return [];
  }

  if (isOwnerOrAdmin(user)) {
    return clients;
  }

  const assignedClientIds = await getAssignedClientIds(user.id);
  return clients.filter((client) => assignedClientIds.includes(client.id));
}

export async function getCurrentDashboardUser() {
  const configuredEmail = process.env.DASHBOARD_CURRENT_USER_EMAIL?.trim();
  const fallbackEmail = process.env.DASHBOARD_OWNER_EMAIL?.trim() || "omarhadida24@gmail.com";
  const email = configuredEmail || fallbackEmail;

  const user = await getUserByEmail(email);

  if (user) {
    return user;
  }

  const state = await readAccessStore();
  return (
    state.users.find((entry) => entry.role === "owner" && entry.status !== "deactivated") ??
    state.users[0] ??
    null
  );
}

export async function getCurrentDashboardUserById(userId?: string | null) {
  if (!userId) {
    return getCurrentDashboardUser();
  }

  return getUserById(userId);
}
