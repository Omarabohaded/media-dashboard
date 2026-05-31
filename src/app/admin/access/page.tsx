"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, StatusPill } from "@/components/AppShell";
import {
  CLIENT_ACCESS_LEVELS,
  USER_ROLES,
  USER_STATUSES,
  getAccessLevelLabel,
  getRoleLabel,
  getStatusLabel,
  type ClientAccessLevel,
  type UserRole,
  type UserStatus,
} from "@/lib/accessTypes";
import { type ClientRecord } from "@/lib/clientTypes";

type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  hasPassword: boolean;
};

type UserAssignment = {
  userId: string;
  clientId: string;
  accessLevel: ClientAccessLevel;
  assignedAt: string;
};

type DraftUser = {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  selectedClientIds: string[];
  accessLevel: ClientAccessLevel;
};

const emptyDraft: DraftUser = {
  name: "",
  email: "",
  role: "manager",
  status: "invited",
  selectedClientIds: [],
  accessLevel: "view",
};

export default function AccessManagementPage() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [draft, setDraft] = useState<DraftUser>(emptyDraft);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients]
  );

  const selectedUser = users.find((user) => user.id === editingUserId) ?? null;

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [usersResponse, clientsResponse] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/admin/clients", { cache: "no-store" }),
      ]);

      if (!usersResponse.ok) {
        throw new Error("Could not load users.");
      }

      if (!clientsResponse.ok) {
        throw new Error("Could not load clients.");
      }

      const usersPayload = (await usersResponse.json()) as {
        users: SafeUser[];
        assignments: UserAssignment[];
      };
      const clientsPayload = (await clientsResponse.json()) as {
        clients: ClientRecord[];
      };

      setUsers(usersPayload.users);
      setAssignments(usersPayload.assignments);
      setClients(clientsPayload.clients);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load access data.");
    } finally {
      setIsLoading(false);
    }
  }

  function getUserAssignments(userId: string) {
    return assignments.filter((assignment) => assignment.userId === userId);
  }

  function getUserClientLabels(userId: string) {
    const userAssignments = getUserAssignments(userId);

    if (!userAssignments.length) {
      return "No clients assigned";
    }

    return userAssignments
      .map((assignment) => {
        const client = clientsById.get(assignment.clientId);
        return `${client?.name ?? assignment.clientId} (${getAccessLevelLabel(assignment.accessLevel)})`;
      })
      .join(", ");
  }

  function startEdit(user: SafeUser) {
    const userAssignments = getUserAssignments(user.id);
    setEditingUserId(user.id);
    setDraft({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      selectedClientIds: userAssignments.map((assignment) => assignment.clientId),
      accessLevel: userAssignments[0]?.accessLevel ?? "view",
    });
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingUserId(null);
    setDraft(emptyDraft);
    setMessage(null);
    setError(null);
  }

  function toggleClient(clientId: string) {
    setDraft((current) => ({
      ...current,
      selectedClientIds: current.selectedClientIds.includes(clientId)
        ? current.selectedClientIds.filter((id) => id !== clientId)
        : [...current.selectedClientIds, clientId],
    }));
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    const clientAssignments = draft.selectedClientIds.map((clientId) => ({
      clientId,
      accessLevel: draft.accessLevel,
    }));

    try {
      const response = await fetch("/api/admin/users", {
        method: editingUserId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUserId ?? undefined,
          name: draft.name,
          email: draft.email,
          role: draft.role,
          status: draft.status,
          clientAssignments,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save user.");
      }

      setMessage(editingUserId ? "User access updated." : "User created.");
      resetForm();
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save user.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Admin Access
              </p>
              <h2 className="mt-1 font-serif-display text-2xl font-semibold tracking-tight text-[var(--ink)]">
                Access Management
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Manage who can use the dashboard, what role they have, and which clients they can access.
              </p>
            </div>
            <StatusPill status="Role-based access foundation" />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr),minmax(0,1.08fr)]">
          <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
            <div className="mb-5">
              <h3 className="font-serif-display text-xl font-semibold text-[var(--ink)]">
                {selectedUser ? "Edit user access" : "Add user"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Add employees or client viewers, assign their role, and connect them to the right clients.
              </p>
            </div>

            <form onSubmit={saveUser} className="space-y-4">
              <label className="block text-sm font-semibold text-[var(--ink)]">
                Name
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  className="mt-2 w-full rounded-[16px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-medium outline-none"
                  placeholder="User name"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-[var(--ink)]">
                Email
                <input
                  value={draft.email}
                  onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                  className="mt-2 w-full rounded-[16px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-medium outline-none disabled:opacity-70"
                  placeholder="user@email.com"
                  type="email"
                  disabled={Boolean(editingUserId)}
                  required
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm font-semibold text-[var(--ink)]">
                  Role
                  <select
                    value={draft.role}
                    onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as UserRole }))}
                    className="mt-2 w-full rounded-[16px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-medium outline-none"
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role.role} value={role.role}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-[var(--ink)]">
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as UserStatus }))}
                    className="mt-2 w-full rounded-[16px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-medium outline-none"
                  >
                    {USER_STATUSES.map((status) => (
                      <option key={status.status} value={status.status}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-semibold text-[var(--ink)]">
                Assignment access level
                <select
                  value={draft.accessLevel}
                  onChange={(event) => setDraft((current) => ({ ...current, accessLevel: event.target.value as ClientAccessLevel }))}
                  className="mt-2 w-full rounded-[16px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-medium outline-none"
                >
                  {CLIENT_ACCESS_LEVELS.map((level) => (
                    <option key={level.accessLevel} value={level.accessLevel}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">Client access</div>
                <div className="mt-2 grid max-h-[260px] gap-2 overflow-y-auto rounded-[18px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                  {clients.length ? (
                    clients.map((client) => (
                      <label
                        key={client.id}
                        className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="font-semibold text-[var(--ink)]">{client.name}</span>
                          <span className="ml-2 text-xs text-[var(--muted)]">{client.currencyCode}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={draft.selectedClientIds.includes(client.id)}
                          onChange={() => toggleClient(client.id)}
                        />
                      </label>
                    ))
                  ) : (
                    <div className="rounded-[14px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                      No clients are available yet.
                    </div>
                  )}
                </div>
              </div>

              {message ? <div className="rounded-[14px] border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900">{message}</div> : null}
              {error ? <div className="rounded-[14px] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-[14px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : selectedUser ? "Update access" : "Create user"}
                </button>
                {selectedUser ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-[14px] border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--ink)]"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-display text-xl font-semibold text-[var(--ink)]">
                  Users and responsibilities
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Review each user role, status, and client coverage from one place.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadData()}
                className="rounded-[14px] border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
              >
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="rounded-[18px] border border-[var(--line)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                Loading access data...
              </div>
            ) : users.length ? (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--ink)]">{user.name}</div>
                        <div className="mt-1 text-sm text-[var(--muted)]">{user.email}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill status={getRoleLabel(user.role)} />
                        <StatusPill status={getStatusLabel(user.status)} />
                      </div>
                    </div>
                    <div className="mt-3 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
                      {getUserClientLabels(user.id)}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
                      <span>{user.hasPassword ? "Password ready" : "Password pending"}</span>
                      <button
                        type="button"
                        onClick={() => startEdit(user)}
                        className="rounded-[12px] bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Edit access
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                No users found yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
