"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarRange,
  Database,
  Gauge,
  LayoutDashboard,
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

export type DashboardDatePreset =
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_30d"
  | "this_month"
  | "last_month";

type DashboardDateContextValue = {
  datePreset: DashboardDatePreset;
  metaPreviewQuery: string;
  activeLabel: string;
  activeSummary: string;
  setDatePreset: (value: DashboardDatePreset) => void;
};

const OwnerModeContext = createContext<OwnerModeContextValue | null>(null);
const DashboardDisplayContext =
  createContext<DashboardDisplayContextValue | null>(null);
const DashboardDateContext = createContext<DashboardDateContextValue | null>(null);

const DASHBOARD_DATE_PRESET_KEY = "media-dashboard-date-preset";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Command Center", href: "/" },
  { icon: ShieldCheck, label: "Business Health", href: "/health" },
  { icon: Target, label: "Funnel", href: "/funnel" },
  { icon: BarChart3, label: "Paid Media", href: "/paid-media" },
  { icon: Rocket, label: "Scaling", href: "/scaling" },
  { icon: Bell, label: "Actions", href: "/action" },
  { icon: Database, label: "Admin", href: "/admin" },
];

const DATE_PRESET_OPTIONS: Array<{
  value: DashboardDatePreset;
  label: string;
}> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7d", label: "Last 7 days" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClientId, setActiveClientId] = useState("");
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [ownerMode, setOwnerModeState] = useState(false);
  const [datePreset, setDatePresetState] =
    useState<DashboardDatePreset>("last_7d");

  const activeClient = useMemo(
    () =>
      clients.find((entry) => entry.id === activeClientId) ?? clients[0] ?? null,
    [activeClientId, clients]
  );

  useEffect(() => {
    const savedOwnerMode =
      typeof window !== "undefined"
        ? window.localStorage.getItem("media-dashboard-owner-mode")
        : null;
    const savedDatePreset =
      typeof window !== "undefined"
        ? window.localStorage.getItem(DASHBOARD_DATE_PRESET_KEY)
        : null;

    setOwnerModeState(savedOwnerMode === "true");

    if (
      savedDatePreset &&
      DATE_PRESET_OPTIONS.some((option) => option.value === savedDatePreset)
    ) {
      setDatePresetState(savedDatePreset as DashboardDatePreset);
    }
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

  function setDatePreset(nextValue: DashboardDatePreset) {
    setDatePresetState(nextValue);
    window.localStorage.setItem(DASHBOARD_DATE_PRESET_KEY, nextValue);
    window.location.reload();
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

  const activeDateRange = useMemo(() => getPresetRange(datePreset), [datePreset]);
  const dashboardDate = useMemo<DashboardDateContextValue>(
    () => ({
      datePreset,
      metaPreviewQuery: `datePreset=${datePreset}`,
      activeLabel:
        DATE_PRESET_OPTIONS.find((option) => option.value === datePreset)?.label ??
        "Last 7 days",
      activeSummary: activeDateRange.summary,
      setDatePreset,
    }),
    [activeDateRange.summary, datePreset]
  );

  const showDateController = pathname !== "/admin";

  return (
    <OwnerModeContext.Provider value={ownerContext}>
      <DashboardDisplayContext.Provider value={dashboardDisplay}>
        <DashboardDateContext.Provider value={dashboardDate}>
          <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
            <Sidebar ownerMode={ownerMode} onToggleOwnerMode={setOwnerMode} />
            <div className="xl:pl-[300px]">
              <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(249,246,239,0.88)] px-6 py-5 backdrop-blur">
                <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
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

                  <div
                    className={`grid gap-3 ${
                      showDateController
                        ? "xl:min-w-[620px] xl:grid-cols-[1.2fr,0.95fr]"
                        : "xl:min-w-[280px]"
                    }`}
                  >
                    {showDateController ? <DateControlCard /> : null}
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
                </div>
              </header>

              <div className="px-6 py-6">{children}</div>
            </div>
          </main>
        </DashboardDateContext.Provider>
      </DashboardDisplayContext.Provider>
    </OwnerModeContext.Provider>
  );
}

function DateControlCard() {
  const { activeLabel, activeSummary, datePreset, setDatePreset } =
    useDashboardDate();

  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-3 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            <CalendarRange size={14} />
            <span>Reporting Window</span>
          </div>
          <div className="mt-2 text-base font-semibold text-[var(--ink)]">
            {activeLabel}
          </div>
          <div className="mt-1 text-sm text-[var(--muted)]">{activeSummary}</div>
        </div>
        <StatusPill status="Live" />
      </div>

      <select
        value={datePreset}
        onChange={(event) =>
          setDatePreset(event.target.value as DashboardDatePreset)
        }
        className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.78)] px-3 py-3 text-sm font-medium text-[var(--ink)] outline-none"
      >
        {DATE_PRESET_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="mt-2 text-xs text-[var(--muted)]">
        Updates live Meta reporting previews across the dashboard.
      </div>
    </div>
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
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
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
              Keep portfolio-level views behind owner mode as we expand them.
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
    /(scale|good|strong|protect|stable|ready|connected|healthy|live)/i.test(status)
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-900"
      : /(watch|actionable|review|weak|hold|blocked|fix|missing|risk)/i.test(status)
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
  bullets = [],
}: {
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.4)] p-5">
      <div className="text-lg font-semibold text-[var(--ink)]">{title}</div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {bullets.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {bullets.map((bullet) => (
            <div
              key={bullet}
              className="rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.52)] px-4 py-3 text-sm text-[var(--muted)]"
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

export function useDashboardDate() {
  const context = useContext(DashboardDateContext);
  if (!context) {
    throw new Error("useDashboardDate must be used inside AppShell");
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

function getPresetRange(preset: DashboardDatePreset) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  const start = new Date(today);

  if (preset === "yesterday") {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  } else if (preset === "last_7d") {
    start.setDate(start.getDate() - 6);
  } else if (preset === "last_30d") {
    start.setDate(start.getDate() - 29);
  } else if (preset === "this_month") {
    start.setDate(1);
  } else if (preset === "last_month") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
  }

  return {
    start,
    end,
    summary: formatRangeSummary(start, end),
  };
}

function formatRangeSummary(start: Date, end: Date) {
  const sameDay = start.toDateString() === end.toDateString();
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (sameDay) {
    return end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${startLabel} - ${endLabel}`;
  }

  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${endLabel}`;
}
