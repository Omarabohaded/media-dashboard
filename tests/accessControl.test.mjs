import assert from "node:assert/strict";
import test from "node:test";

const { hasValidAuthenticatedSession } = await import("../src/lib/sessionPolicy.ts");
const {
  canAccessClientWithAssignments,
  canManageClientsByRole,
} = await import("../src/lib/authorizationPolicy.ts");

const now = Date.parse("2026-07-23T12:00:00.000Z");
const activeManager = {
  id: "user-manager",
  name: "Manager",
  email: "manager@example.com",
  role: "manager",
  status: "active",
  passwordHash: null,
  createdAt: "",
  updatedAt: "",
  lastLoginAt: null,
};
const activeAdmin = { ...activeManager, id: "user-admin", role: "admin" };

test("no cookie resolves to no authenticated session", () => {
  assert.equal(hasValidAuthenticatedSession(null, now), false);
});

test("fabricated cookie without a verified session is rejected", () => {
  assert.equal(hasValidAuthenticatedSession({ user: null }, now), false);
});

test("expired or invalid sessions are rejected", () => {
  assert.equal(
    hasValidAuthenticatedSession(
      { user: { id: "user-manager" }, expires: "2026-07-23T11:59:59.000Z" },
      now
    ),
    false
  );
  assert.equal(
    hasValidAuthenticatedSession(
      { user: { id: "user-manager" }, expires: "not-a-date" },
      now
    ),
    false
  );
});

test("valid verified session is accepted", () => {
  assert.equal(
    hasValidAuthenticatedSession(
      { user: { id: "user-manager" }, expires: "2026-07-23T13:00:00.000Z" },
      now
    ),
    true
  );
});

test("visible and unauthorized clients are distinguished", () => {
  assert.equal(
    canAccessClientWithAssignments(activeManager, "client-visible", ["client-visible"]),
    true
  );
  assert.equal(
    canAccessClientWithAssignments(activeManager, "client-hidden", ["client-visible"]),
    false
  );
});

test("non-admin users cannot use owner/admin management operations", () => {
  assert.equal(canManageClientsByRole(activeManager), false);
  assert.equal(canManageClientsByRole(activeAdmin), true);
});
