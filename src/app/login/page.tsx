"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      window.location.href = callbackUrl;
    }
  }, [callbackUrl, status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      accessKey,
      callbackUrl,
      redirect: false,
    });

    if (result?.error) {
      setError("The email or access key is incorrect, or this user is not active.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = result?.url || callbackUrl;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-10 text-[var(--ink)]">
      <section className="w-full max-w-md rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Operator OS
        </p>
        <h1 className="mt-2 font-serif-display text-3xl font-semibold tracking-tight">
          Sign in to your dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Use the account and access key created for you in Access Management.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
              className="mt-2 w-full rounded-[16px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
              placeholder="you@email.com"
            />
          </label>

          <label className="block text-sm font-semibold">
            Access key
            <input
              value={accessKey}
              onChange={(event) => setAccessKey(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-[16px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
              placeholder="Enter your access key"
            />
          </label>

          {error ? (
            <div className="rounded-[14px] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || status === "loading"}
            className="w-full rounded-[16px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
