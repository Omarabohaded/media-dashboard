import {
  type ClientAccessLevel,
  type DashboardUser,
  type UserClientAssignment,
  type UserRole,
  type UserStatus,
} from "@/lib/accessTypes";
import { getPasswordHashFormat, hashPassword } from "@/lib/password";
import {
  getRuntimeStorageMeta,
  readRuntimeJsonStore,
  writeRuntimeJsonStore,
} from "@/lib/runtimeStorage";

export type AccessStoreState = {
  version: 1;
  updatedAt: string | null;
  users: DashboardUser[];
  assignments: UserClientAssignment[];
};

const ACCESS_STORE_KEY = "media-dashboard:access-state";
const ACCESS_STORE_FILE = "access-state.json";
const DEFAULT_OWNER_EMAIL = "omarhadida24@gmail.com";

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getBootstrapPasswordHash() {
  const bootstrapPassword = process.env.DASHBOARD_BOOTSTRAP_PASSWORD?.trim();
  return bootstrapPassword ? hashPassword(bootstrapPassword) : null;
}

function buildDefaultOwner(): DashboardUser {
  const createdAt = nowIso();

  return {
    id: "user-owner-omar",
    name: "Omar Abohaded",
    email: DEFAULT_OWNER_EMAIL,
    role: "owner",
    status: "active",
    passwordHash: getBootstrapPasswordHash(),
    createdAt,
    updatedAt: createdAt,
    lastLoginAt: null,
  };
}

function defaultState(): AccessStoreState {
  return {
    version: 1,
    updatedAt: null,
    users: [buildDefaultOwner()],
    assignments: [],
  };
}

function shouldRepairDefaultOwnerPassword(user: DashboardUser) {
  if (normalizeEmail(user.email) !== DEFAULT_OWNER_EMAIL) {
    return false;
  }

  const format = getPasswordHashFormat(user.passwordHash);
  return format === "missing" || format === "malformed";
}

function normalizeState(state: AccessStoreState): AccessStoreState {
  const fallback = defaultState();
  const bootstrapPasswordHash = getBootstrapPasswordHash();
  const users = (state.users?.length ? state.users : fallback.users).map((user) => {
    const normalizedUser = {
      ...user,
      email: normalizeEmail(user.email),
      status: user.status ?? "invited",
      passwordHash: user.passwordHash ?? null,
      updatedAt: user.updatedAt ?? user.createdAt ?? nowIso(),
      lastLoginAt: user.lastLoginAt ?? null,
    };

    if (bootstrapPasswordHash && shouldRepairDefaultOwnerPassword(normalizedUser)) {
      return {
        ...normalizedUser,
        role: normalizedUser.role === "owner" ? normalizedUser.role : "owner",
        status: normalizedUser.status === "deactivated" ? "active" : normalizedUser.status,
        passwordHash: bootstrapPasswordHash,
        updatedAt: nowIso(),
      };
    }

    return normalizedUser;
  });

  const hasOwner = users.some(
    (user) => user.role === "owner" && user.status !== "deactivated"
  );

  return {
    version: 1,
    updatedAt: state.updatedAt ?? null,
    users: hasOwner ? users : [buildDefaultOwner(), ...users],
    assignments: state.assignments ?? [],
  };
}

export async function readAccessStore() {
  const parsed = await readRuntimeJsonStore<AccessStoreState>(
    ACCESS_STORE_KEY,
    ACCESS_STORE_FILE,
    defaultState()
  );

  return normalizeState({
    ...defaultState(),
    ...parsed,
  });
}

async function updateAccessStore(
  updater: (state: AccessStoreState) => AccessStoreState
) {
  const current = await readAccessStore();
  const next = normalizeState(updater(current));
  next.updatedAt = nowIso();
  await writeRuntimeJsonStore(ACCESS_STORE_KEY, ACCESS_STORE_FILE, next);
  return next;
}

export function getAccessStoreMeta() {
  return getRuntimeStorageMeta(ACCESS_STORE_FILE);
}

export async function listUsers() {
  const state = await readAccessStore();
  return state.users;
}

export async function listAssignments() {
  const state = await readAccessStore();
  return state.assignments;
}

export async function clearClientAssignments(clientId: string) {
  await updateAccessStore((state) => ({
    ...state,
    assignments: state.assignments.filter(
      (assignment) => assignment.clientId !== clientId
    ),
  }));
}

export async function getUserById(userId: string) {
  const state = await readAccessStore();
  return state.users.find((user) => user.id === userId) ?? null;
}

export async function getUserByEmail(email: string) {
  const state = await readAccessStore();
  const normalizedEmail = normalizeEmail(email);
  return state.users.find((user) => user.email === normalizedEmail) ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  password?: string;
  clientAssignments?: Array<{ clientId: string; accessLevel: ClientAccessLevel }>;
}) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  if (!name) {
    throw new Error("User name is required.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("A valid email is required.");
  }

  const createdAt = nowIso();
  const user: DashboardUser = {
    id: `user-${crypto.randomUUID()}`,
    name,
    email,
    role: input.role,
    status: input.status ?? "invited",
    passwordHash: input.password ? hashPassword(input.password.trim()) : null,
    createdAt,
    updatedAt: createdAt,
    lastLoginAt: null,
  };

  const nextState = await updateAccessStore((state) => {
    const existing = state.users.some((entry) => entry.email === email);

    if (existing) {
      throw new Error("A user with this email already exists.");
    }

    const assignments = [
      ...state.assignments,
      ...(input.clientAssignments ?? []).map((assignment) => ({
        userId: user.id,
        clientId: assignment.clientId,
        accessLevel: assignment.accessLevel,
        assignedAt: createdAt,
      })),
    ];

    return {
      ...state,
      users: [user, ...state.users],
      assignments,
    };
  });

  return nextState.users.find((entry) => entry.id === user.id) ?? user;
}

export async function updateUser(input: {
  userId: string;
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
  clientAssignments?: Array<{ clientId: string; accessLevel: ClientAccessLevel }>;
}) {
  const updatedAt = nowIso();

  const nextState = await updateAccessStore((state) => {
    const target = state.users.find((user) => user.id === input.userId);

    if (!target) {
      throw new Error("User was not found.");
    }

    const activeOwners = state.users.filter(
      (user) => user.role === "owner" && user.status !== "deactivated"
    );
    const wouldRemoveLastOwner =
      target.role === "owner" &&
      activeOwners.length <= 1 &&
      ((input.role && input.role !== "owner") || input.status === "deactivated");

    if (wouldRemoveLastOwner) {
      throw new Error("At least one active owner must remain.");
    }

    const users = state.users.map((user) =>
      user.id === input.userId
        ? {
            ...user,
            name: input.name?.trim() || user.name,
            role: input.role ?? user.role,
            status: input.status ?? user.status,
            passwordHash: input.password ? hashPassword(input.password.trim()) : user.passwordHash,
            updatedAt,
          }
        : user
    );

    const assignments =
      input.clientAssignments === undefined
        ? state.assignments
        : [
            ...state.assignments.filter((assignment) => assignment.userId !== input.userId),
            ...input.clientAssignments.map((assignment) => ({
              userId: input.userId,
              clientId: assignment.clientId,
              accessLevel: assignment.accessLevel,
              assignedAt: updatedAt,
            })),
          ];

    return {
      ...state,
      users,
      assignments,
    };
  });

  return nextState.users.find((user) => user.id === input.userId) ?? null;
}

export async function deactivateUser(userId: string) {
  return updateUser({ userId, status: "deactivated" });
}

export async function reactivateUser(userId: string) {
  return updateUser({ userId, status: "active" });
}

export async function removeUser(userId: string) {
  await updateAccessStore((state) => {
    const target = state.users.find((user) => user.id === userId);

    if (!target) {
      throw new Error("User was not found.");
    }

    const activeOwners = state.users.filter(
      (user) => user.role === "owner" && user.status !== "deactivated"
    );

    if (target.role === "owner" && activeOwners.length <= 1) {
      throw new Error("At least one active owner must remain.");
    }

    return {
      ...state,
      users: state.users.filter((user) => user.id !== userId),
      assignments: state.assignments.filter((assignment) => assignment.userId !== userId),
    };
  });
}

export async function getAssignedClientIds(userId: string) {
  const state = await readAccessStore();
  return state.assignments
    .filter((assignment) => assignment.userId === userId)
    .map((assignment) => assignment.clientId);
}

export function sanitizeUser(user: DashboardUser) {
  const { passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    hasPassword: Boolean(passwordHash),
  };
}
