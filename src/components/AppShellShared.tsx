"use client";

import { type ReactNode } from "react";
import { getCurrencyMeta, type ClientCurrencyCode } from "@/lib/clientTypes";

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="mb-5">
        <h2 className="font-serif-display text-2xl font-semibold tracking-tight text-[var(--ink)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function PageLead({
  eyebrow,
  title,
  summary,
}: {
  eyebrow: string;
  title: string;
  summary: string;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-serif-display text-[24px] leading-tight font-semibold tracking-tight text-[var(--ink)] md:text-[28px]">
        {title}
      </h2>
      <p className="mt-1.5 max-w-4xl text-sm leading-6 text-[var(--muted)]">
        {summary}
      </p>
    </div>
  );
}

export function MiniMetric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "bad" | "warn" | "default";
}) {
  const color =
    tone === "good"
      ? "text-emerald-800"
      : tone === "bad"
      ? "text-rose-800"
      : tone === "warn"
      ? "text-amber-800"
      : "text-[var(--ink)]";

  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${color}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function EmptySectionState({
  title,
  description,
  bullets = [],
}: {
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-5">
      <div className="text-lg font-semibold text-[var(--ink)]">{title}</div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {bullets.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {bullets.map((bullet) => (
            <div
              key={bullet}
              className="rounded-[18px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]"
            >
              {bullet}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardLoadingState({
  title = "Loading dashboard state",
  description = "Pulling the active client, connection status, and source readiness now.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="text-lg font-semibold text-[var(--ink)]">{title}</div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="h-20 animate-pulse rounded-[18px] border border-[var(--line)] bg-[var(--surface-muted)]" />
        <div className="h-20 animate-pulse rounded-[18px] border border-[var(--line)] bg-[var(--surface-muted)]" />
        <div className="h-20 animate-pulse rounded-[18px] border border-[var(--line)] bg-[var(--surface-muted)]" />
      </div>
    </div>
  );
}

export function SourcePill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "good" | "warn" | "bad" | "default";
}) {
  const color =
    tone === "good"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-900"
      : tone === "warn"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-900"
      : tone === "bad"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-900"
      : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

export function DisplayValue({
  value,
  currencyCode = "USD",
}: {
  value: string;
  currencyCode?: ClientCurrencyCode;
}) {
  if (!value.startsWith("$")) {
    return <>{value}</>;
  }

  const parsed = Number(value.slice(1).replace(/,/g, ""));

  if (!Number.isFinite(parsed)) {
    return <>{value}</>;
  }

  const { locale } = getCurrencyMeta(currencyCode);

  return (
    <>
      {new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 0,
      }).format(parsed)}
    </>
  );
}
