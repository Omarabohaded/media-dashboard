"use client";

import { useEffect, useState } from "react";
import { AppShell, Section } from "@/components/AppShell";
import {
  applyDashboardTheme,
  type DashboardTheme,
} from "@/components/DashboardThemeProvider";

const THEMES: Array<{
  id: DashboardTheme;
  name: string;
  description: string;
  highlights: string[];
}> = [
  {
    id: "default",
    name: "Warm Operator",
    description:
      "A warmer operational workspace optimized for long daily usage and softer dashboard contrast.",
    highlights: [
      "Warm ivory backgrounds",
      "Brown-orange operational accent",
      "Lower eye fatigue for long sessions",
    ],
  },
  {
    id: "executive",
    name: "Executive Slate",
    description:
      "A sharper executive reporting palette with cooler surfaces and stronger business-style contrast.",
    highlights: [
      "Cool slate backgrounds",
      "Blue executive accent",
      "Higher readability and cleaner data contrast",
    ],
  },
];

export default function AdminThemePage() {
  const [activeTheme, setActiveTheme] = useState<DashboardTheme>("default");

  useEffect(() => {
    const storedTheme =
      (window.localStorage.getItem("media-dashboard-theme") as DashboardTheme | null) ??
      "default";

    setActiveTheme(storedTheme);
  }, []);

  function handleThemeChange(theme: DashboardTheme) {
    applyDashboardTheme(theme);
    setActiveTheme(theme);
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <Section
          title="Dashboard Themes"
          subtitle="Control the global dashboard color system from one place instead of maintaining scattered page-by-page color overrides."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {THEMES.map((theme) => {
              const active = activeTheme === theme.id;

              return (
                <div
                  key={theme.id}
                  className={`rounded-[24px] border p-5 transition ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow)]"
                      : "border-[var(--line)] bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xl font-semibold text-[var(--ink)]">
                        {theme.name}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {theme.description}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        active
                          ? "border-[var(--accent)] bg-[var(--surface-strong)] text-[var(--accent)]"
                          : "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--muted)]"
                      }`}
                    >
                      {active ? "Active" : "Available"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--bg-soft)] p-4">
                      <div className="h-10 rounded-xl bg-[var(--bg)]" />
                      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                        Background
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--bg-soft)] p-4">
                      <div className="h-10 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)]" />
                      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                        Surface
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--bg-soft)] p-4">
                      <div className="h-10 rounded-xl bg-[var(--accent)]" />
                      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                        Accent
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {theme.highlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="rounded-[14px] border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--muted-strong)]"
                      >
                        {highlight}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => handleThemeChange(theme.id)}
                      className={`rounded-[14px] px-5 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "bg-[var(--ink)] text-white"
                          : "bg-[var(--accent)] text-white hover:opacity-90"
                      }`}
                    >
                      {active ? "Currently Active" : "Activate Theme"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
