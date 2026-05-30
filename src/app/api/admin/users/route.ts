import { NextResponse } from "next/server";
import {
  createUser,
  listAssignments,
  listUsers,
  sanitizeUser,
  updateUser,
} from "@/lib/accessStore";
import {
  CLIENT_ACCESS_LEVELS,
  USER_ROLES,
  USER_STATUSES,
  type ClientAccessLevel,
  type UserRole,
  type UserStatus,
} from "@/lib/accessTypes";

function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.some((item) => item.role === value);
}

function isValidStatus(value: unknown): value is UserStatus {
  return typeof value === "string" && USER_STATUSES.some((item) => item.status === value);
}

function isValidAccessLevel(value: unknown): value is ClientAccessLevel {
  return typeof value === "string" && CLIENT_ACCESS_LEVELS.some((item) => item.accessLevel === value);
}

function parseAssignments(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const assignment = entry as { clientId?: unknown; accessLevel?: unknown };
      if (typeof assignment.clientId !== "string" || !assignment.clientId.trim()) return null;
      if (!isValidAccessLevel(assignment.accessLevel)) return null;
      return { clientId: assignment.clientId, accessLevel: assignment.accessLevel };
    })
    .filter((entry): entry is { clientId: string; accessLevel: ClientAccessLevel } => Boolean(entry));
}

export async function GET() {
  const [users, assignments] = await Promise.all([listUsers(), listAssignments()]);
  return NextResponse.json({ users: users.map(sanitizeUser), assignments });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      role?: unknown;
      status?: unknown;
      clientAssignments?: unknown;
    };

    if (typeof body.name !== "string" || typeof body.email !== "string") {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    if (!isValidRole(body.role)) {
      return NextResponse.json({ error: "A valid role is required." }, { status: 400 });
    }

    const status = isValidStatus(body.status) ? body.status : "invited";
    const user = await createUser({
      name: body.name,
      email: body.email,
      role: body.role,
      status,
      clientAssignments: parseAssignments(body.clientAssignments),
    });

    return NextResponse.json({ user: sanitizeUser(user) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create user." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: unknown;
      name?: unknown;
      role?: unknown;
      status?: unknown;
      clientAssignments?: unknown;
    };

    if (typeof body.userId !== "string" || !body.userId.trim()) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 });
    }

    const role = body.role === undefined ? undefined : isValidRole(body.role) ? body.role : null;
    const status = body.status === undefined ? undefined : isValidStatus(body.status) ? body.status : null;

    if (role === null) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    if (status === null) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

    const user = await updateUser({
      userId: body.userId,
      name: typeof body.name === "string" ? body.name : undefined,
      role,
      status,
      clientAssignments: body.clientAssignments === undefined ? undefined : parseAssignments(body.clientAssignments),
    });

    if (!user) return NextResponse.json({ error: "User was not found." }, { status: 404 });

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update user." },
      { status: 400 }
    );
  }
}
