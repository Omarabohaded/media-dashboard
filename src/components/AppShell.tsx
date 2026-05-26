"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Database,
  Gauge,
  Home,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { getCurrencyMeta, type ClientRecord } from "@/lib/clientTypes";

type ClientDirectoryResponse = {
  clients: ClientRecord[];
  activeClientId: string;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClientId, setActiveClientId] = useState("");

  const activeClient = useMemo(
    () =>
      clients.find((entry) => entry.id === activeClientId) ?? clients[0] ?? null,
    [activeClientId, clients]
  );

  useEffect(() => {
    async function loadClients() {
      const preferredClientId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("media-dashboard-active-client")
          : null;
      const query = preferredClientId
        ? `?clientId=${encodeURIComponent(preferredClientId)}`
        : "";

      try {
        const response = await fetch(`/api/admin/clients${query}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ClientDirectoryResponse;
        setClients(payload.clients);
        setActiveClientId(payload.activeClientId);
      } catch {
        setClients([]);
        setActiveClientId("");
      }
    }

    void loadClients();
  }, [pathname]);

  function handleClientSwitch(nextClientId: string) {
    setActiveClientId(nextClientId);
    window.localStorage.setItem("media-dashboard-active-client", nextClientId);

    if (pathname === "/admin") {
      window.location.href = `/admin?clientId=${encodeURIComponent(nextClientId)}`;
      return;
    }

    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />
      <div className="xl:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#07111f]/95 px-6 py-5 backdrop-blur">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-sm font-bold text-blue-200">
                  {activeClient?.name ?? "Client not selected"}
                </span>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1 text-sm font-bold text-amber-200">
                  {activeClient
                    ? getCurrencyMeta(activeClient.currencyCode).label
                    : "Currency pending"}
                </span>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-sm font-bold text-emerald-200">Scale safely first</span>
                <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-1 text-sm font-bold text-purple-200">Store sales truth</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">Performance Marketing Command Center</h1>
              <p className="mt-2 text-slate-400">Daily decisions first · reporting second · active client always visible</p>
            </div>
            <div className="min-w-[280px] rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="text-xs font-black uppercase tracking-wide text-slate-400">
                Quick Client Switch
              </div>
              <select
                value={activeClientId}
                onChange={(event) => handleClientSwitch(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-semibold text-white outline-none"
              >
                {clients.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} · {entry.currencyCode}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </main>
  );
}

function Sidebar() {
  const pathname = usePathname();

  const items = [
    [Home, "Command Center", "/"],
    [ShieldCheck, "Business Health", "/health"],
    [Rocket, "Scaling Engine", "/scaling"],
    [Bell, "What Needs Action", "/action"],
    [Database, "Admin Panel", "/admin"],
  ];

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[280px] border-r border-slate-800/80 bg-[#071421] text-slate-100 xl:flex xl:flex-col">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-900/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Gauge size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black">Performance OS</h2>
            <p className="text-sm text-slate-400">Live client workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-5 pb-4 pr-3">
        {items.map(([Icon, label, href]) => {
          const active = pathname === href;
          return (
            <Link
              key={label as string}
              href={href as string}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon size={19} />
              <span>{label as string}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Bell size={16} />
            <span className="font-black">Connection Aware</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Live data where connected · honest empty states where it is not</p>
        </div>
      </div>
    </aside>
  );
}

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 shadow-xl shadow-black/20">
      <div className="mb-5">
        <h3 className="text-xl font-black uppercase tracking-tight text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function MiniMetric({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "good" | "bad" | "warn" | "default" }) {
  const color = tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-300" : tone === "warn" ? "text-amber-300" : "text-white";
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Scale: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Good: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Stable: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Hold: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Watch: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Fix: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return <span className={`rounded-lg border px-3 py-1 text-xs font-black uppercase ${styles[status] || styles.Stable}`}>{status}</span>;
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
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-5">
      <div className="text-lg font-black text-white">{title}</div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
        {description}
      </p>
      {bullets.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {bullets.map((bullet) => (
            <div
              key={bullet}
              className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300"
            >
              {bullet}
            </div>
          ))}
        </div>
      ) : null}
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
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : tone === "warn"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
      : tone === "bad"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : "border-slate-700 bg-slate-900 text-slate-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${color}`}>
      {label}
    </span>
  );
}
