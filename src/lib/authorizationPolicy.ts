export type AuthorizationUser = {
  role: "owner" | "admin" | "manager" | "client_viewer";
  status: "invited" | "active" | "deactivated";
} | null | undefined;

export function isOwnerOrAdminRole(user: AuthorizationUser) {
  return (
    user?.status !== "deactivated" &&
    (user?.role === "owner" || user?.role === "admin")
  );
}

export function canManageClientsByRole(user: AuthorizationUser) {
  return isOwnerOrAdminRole(user);
}

export function canAccessClientWithAssignments(
  user: AuthorizationUser,
  clientId: string,
  assignedClientIds: string[]
) {
  if (!user || user.status === "deactivated") return false;
  return isOwnerOrAdminRole(user) || assignedClientIds.includes(clientId);
}
