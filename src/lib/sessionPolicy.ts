export type SessionIdentity = {
  user?: { id?: string | null } | null;
  expires?: string | null;
} | null | undefined;

export function hasValidAuthenticatedSession(
  session: SessionIdentity,
  now = Date.now()
) {
  const userId = session?.user?.id?.trim();
  if (!userId) return false;

  if (session?.expires) {
    const expiresAt = Date.parse(session.expires);
    if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;
  }

  return true;
}
