"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpenText,
  Database,
  Gauge,
  LayoutDashboard,
  Layers3,
  Rocket,
  ShieldCheck,
  Target,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCurrencyMeta,
  type ClientCurrencyCode,
  type ClientRecord,
} from "@/lib/clientTypes";

type ClientDirectoryResponse = {
  clients: ClientRecord[];
  activeClientId: string;
};

type OwnerModeContextValue = {
  ownerMode: boolean;
  setOwnerMode: (value: boolean) => void;
};

type DashboardDisplayContextValue = {
  currencyCode: ClientCurrencyCode;
  formatValue: (value: string) => string;
};

const OwnerModeContext = createContext<OwnerModeContextValue | null>(null);
const DashboardDisplayContext =
  createContext<DashboardDisplayContextValue | null>(null);

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Command Center", href: "/#command-center" },
  { icon: ShieldCheck, label: "Business Health", href: "/#business-health" },
  { icon: Target, label: "Funnel", href: "/#funnel" },
  { icon: BarChart3, label: "Channel Breakdown", href: "/#channel-breakdown" },
  { icon: Rocket, label: "Scaling", href: "/#scaling" },
  { icon: Bell, label: "Actions", href: "/#actions" },
  { icon: Layers3, label: "Portfolio Overview", href: "/#portfolio-overview" },
  { icon: BookOpenText, label: "Metric Guide", href: "/#metric-guide" },
  { icon: Database, label: "Admin", href: "/#admin" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClientId, setActiveClientId] = useState("");
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [ownerMode, setOwnerModeState] = useState(false);

  const activeClient = useMemo(
    () =>
      clients.find((entry) => entry.id === activeClientId) ?? clients[0] ?? null,
    [activeClientId, clients]
  );

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("media-dashboard-owner-mode")
        : null;
    setOwnerModeState(saved === "true");
  }, []);

  useEffect(() => {
    async function loadClients() {
      setIsLoadingClients(true);
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

        if (!response.ok) {
          throw new Error("Client directory unavailable");
        }

        const payload = (await response.json()) as ClientDirectoryResponse;
        const nextClientId =
          preferredClientId &&
          payload.clients.some((entry) => entry.id === preferredClientId)
            ? preferredClientId
            : payload.activeClientId;
        setClients(payload.clients);
        setActiveClientId(nextClientId);
      } catch {
        setClients([]);
        setActiveClientId("");
      } finally {
        setIsLoadingClients(false);
      }
    }

    void loadClients();
  }, [pathname]);

  function handleClientSwitch(nextClientId: string) {
    setActiveClientId(nextClientId);
    window.localStorage.setItem("media-dashboard-active-client", nextClientId);
    window.location.reload();
  }

  function setOwnerMode(nextValue: boolean) {
    setOwnerModeState(nextValue);
    window.localStorage.setItem("media-dashboard-owner-mode", String(nextValue));
  }

  const ownerContext = useMemo(
    () => ({
      ownerMode,
      setOwnerMode,
    }),
    [ownerMode]
  );

  const dashboardDisplay = useMemo<DashboardDisplayContextValue>(() => {
    const currencyCode = activeClient?.currencyCode ?? "USD";
    return {
      currencyCode,
      formatValue: (value: string) => formatMetricValue(value, currencyCode),
    };
  }, [activeClient?.currencyCode]);

  return (
    <OwnerModeContext.Provider value={ownerContext}>
      <DashboardDisplayContext.Provider value={dashboardDisplay}>
        <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
          <Sidebar ownerMode={ownerMode} onToggleOwnerMode={setOwnerMode} />
          <div className="xl:pl-[300px]">
            <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(249,246,239,0.88)] px-6 py-5 backdrop-blur">
              <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <InfoChip tone="default">
                      {isLoadingClients
                        ? "Loading client..."
                        : activeClient?.name ?? "No client selected"}
                    </InfoChip>
                    <InfoChip tone="warn">
                      {isLoadingClients
                        ? "Currency loading"
                        : activeClient
                        ? getCurrencyMeta(activeClient.currencyCode).label
                        : "Currency pending"}
                    </InfoChip>
                    <InfoChip tone="good">Store sales truth first</InfoChip>
                    <InfoChip tone={ownerMode ? "good" : "default"}>
                      {ownerMode ? "Owner mode on" : "Owner mode off"}
                    </InfoChip>
                  </div>
                  <h1 className="font-serif-display text-3xl leading-tight font-semibold tracking-tight md:text-5xl">
                    Media Buying Reporting Dashboard
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)] md:text-base">
                    Decision-first reporting across business truth, platform truth,
                    blended metrics, and confidence-based recommendations.
                  </p>
                </div>

                <div className="min-w-[280px] rounded-[20px] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-3 shadow-[var(--shadow)]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Active Client
                  </div>
                  <select
                    value={activeClientId}
                    onChange={(event) => handleClientSwitch(event.target.value)}
                    disabled={isLoadingClients || clients.length === 0}
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.78)] px-3 py-3 text-sm font-medium text-[var(--ink)] outline-none"
                  >
                    {isLoadingClients ? (
                      <option value="">Loading clients...</option>
                    ) : clients.length ? (
                      clients.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name} · {entry.currencyCode}
                        </option>
                      ))
                    ) : (
                      <option value="">Create a client in Admin first</option>
                    )}
                  </select>
                </div>
              </div>
            </header>

            <div className="px-6 py-6">{children}</div>
          </div>
        </main>
      </DashboardDisplayContext.Provider>
    </OwnerModeContext.Provider>
  );
}

function Sidebar({
  ownerMode,
  onToggleOwnerMode,
}: {
  ownerMode: boolean;
  onToggleOwnerMode: (value: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[300px] border-r border-[var(--line)] bg-[rgba(251,248,242,0.86)] px-5 py-6 text-[var(--ink)] backdrop-blur xl:flex xl:flex-col">
      <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.54)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white">
            <Gauge size={24} />
          </div>
          <div>
            <h2 className="font-serif-display text-2xl leading-none font-semibold">
              Operator OS
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Media buying reporting workspace
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-2">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = pathname === "/" && href === "/#command-center";
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-[rgba(161,66,26,0.16)] text-[var(--accent)]"
                  : "text-[var(--ink)] hover:bg-[rgba(20,34,24,0.05)]"
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.55)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Owner Access
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Reveal the portfolio-level overview page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleOwnerMode(!ownerMode)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              ownerMode
                ? "bg-[var(--ink)] text-white"
                : "bg-[rgba(20,34,24,0.08)] text-[var(--ink)]"
            }`}
          >
            {ownerMode ? "On" : "Off"}
          </button>
        </div>
      </div>
    </aside>
  );
}

function InfoChip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "good" | "warn" | "default";
}) {
  const toneClasses =
    tone === "good"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-900"
      : tone === "warn"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-900"
      : "border-[var(--line)] bg-[rgba(255,255,255,0.62)] text-[var(--ink)]";

  return (
    <span
      className={`rounded-full border px-4 py-1 text-sm font-medium ${toneClasses}`}
    >
      {children}
    </span>
  );
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.52)] p-5 shadow-[var(--shadow)]">
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
    <div className="rounded-[30px] border border-[var(--line)] bg-[linear-gradient(140deg,rgba(161,66,26,0.12),rgba(255,255,255,0.7))] p-7 shadow-[var(--shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 max-w-4xl font-serif-display text-4xl leading-tight font-semibold tracking-tight text-[var(--ink)] md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--muted)]">
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
  const { formatValue } = useDashboardDisplay();
  const color =
    tone === "good"
      ? "text-emerald-800"
      : tone === "bad"
      ? "text-rose-800"
      : tone === "warn"
      ? "text-amber-800"
      : "text-[var(--ink)]";

  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.58)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${color}`}>
        {formatValue(value)}
      </p>
      {hint ? (
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function DisplayValue({ value }: { value: string }) {
  const { formatValue } = useDashboardDisplay();
  return <>{formatValue(value)}</>;
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    /(scale|good|strong|protect|stable)/i.test(status)
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-900"
      : /(watch|actionable|review|weak|hold)/i.test(status)
      ? "border-amber-500/25 bg-amber-500/10 text-amber-900"
      : "border-[var(--line)] bg-[rgba(255,255,255,0.58)] text-[var(--ink)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}

export function EmptySectionState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.4)] p-5">
      <div className="text-lg font-semibold text-[var(--ink)]">{title}</div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
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
    <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.52)] p-5 shadow-[var(--shadow)]">
      <div className="text-lg font-semibold text-[var(--ink)]">{title}</div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="h-20 animate-pulse rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.55)]" />
        <div className="h-20 animate-pulse rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.55)]" />
        <div className="h-20 animate-pulse rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.55)]" />
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
      : "border-[var(--line)] bg-[rgba(255,255,255,0.58)] text-[var(--ink)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

export function useOwnerMode() {
  const context = useContext(OwnerModeContext);
  if (!context) {
    throw new Error("useOwnerMode must be used inside AppShell");
  }
  return context;
}

export function useDashboardDisplay() {
  const context = useContext(DashboardDisplayContext);
  if (!context) {
    throw new Error("useDashboardDisplay must be used inside AppShell");
  }
  return context;
}

function formatMetricValue(value: string, currencyCode: ClientCurrencyCode) {
  if (!value.startsWith("$")) {
    return value;
  }

  const normalized = value.slice(1).replace(/,/g, "").trim();
  const multiplier =
    normalized.endsWith("k")
      ? 1_000
      : normalized.endsWith("m")
      ? 1_000_000
      : normalized.endsWith("b")
      ? 1_000_000_000
      : 1;
  const numericText =
    multiplier === 1 ? normalized : normalized.slice(0, normalized.length - 1);
  const parsed = Number(numericText);

  if (!Number.isFinite(parsed)) {
    return value;
  }

  const amount = parsed * multiplier;
  const { locale } = getCurrencyMeta(currencyCode);
  const maximumFractionDigits = multiplier === 1 && Number.isInteger(amount) ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    notation: multiplier === 1 ? "standard" : "compact",
    compactDisplay: "short",
    maximumFractionDigits,
  }).format(amount);
}
