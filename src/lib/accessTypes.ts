export type UserRole = "owner" | "admin" | "manager" | "client_viewer";

export type UserStatus = "invited" | "active" | "deactivated";

export type ClientAccessLevel = "view" | "manage" | "admin";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type UserClientAssignment = {
  userId: string;
  clientId: string;
  accessLevel: ClientAccessLevel;
  assignedAt: string;
};

export const USER_ROLES: Array<{ role: UserRole; label: string; description: string }> = [
  {
    role: "owner",
    label: "Owner",
    description: "Full dashboard, settings, user, client, and integration control.",
  },
  {
    role: "admin",
    label: "Admin",
    description: "Can manage setup, integrations, users, and client access.",
  },
  {
    role: "manager",
    label: "Manager",
    description: "Can work on assigned client reporting workspaces without system setup access.",
  },
  {
    role: "client_viewer",
    label: "Client Viewer",
    description: "Customer access for assigned client reports only.",
  },
];

export const USER_STATUSES: Array<{ status: UserStatus; label: string }> = [
  { status: "invited", label: "Invited" },
  { status: "active", label: "Active" },
  { status: "deactivated", label: "Deactivated" },
];

export const CLIENT_ACCESS_LEVELS: Array<{
  accessLevel: ClientAccessLevel;
  label: string;
  description: string;
}> = [
  {
    accessLevel: "view",
    label: "View",
    description: "Can view assigned client reports.",
  },
  {
    accessLevel: "manage",
    label: "Manage",
    description: "Can manage assigned client reporting workflows.",
  },
  {
    accessLevel: "admin",
    label: "Admin",
    description: "Can administer assigned client setup when allowed by role.",
  },
];

export function getRoleLabel(role: UserRole) {
  return USER_ROLES.find((item) => item.role === role)?.label ?? role;
}

export function getStatusLabel(status: UserStatus) {
  return USER_STATUSES.find((item) => item.status === status)?.label ?? status;
}

export function getAccessLevelLabel(accessLevel: ClientAccessLevel) {
  return (
    CLIENT_ACCESS_LEVELS.find((item) => item.accessLevel === accessLevel)?.label ??
    accessLevel
  );
}
