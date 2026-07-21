"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  Bell,
  Building2,
  Database,
  Gauge,
  LayoutDashboard,
  LogOut,
  Palette,
  Rocket,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrencyMeta, type ClientCurrencyCode, type ClientRecord } from "@/lib/clientTypes";
import { getRoleLabel, type UserRole } from "@/lib/accessTypes";
import { ACTIVE_CLIENT_STORAGE_KEY, persistActiveClient } from "@/lib/clientContext";

export {
  DashboardLoadingState,
  DisplayValue,
  EmptySectionState,
  MiniMetric,
  PageLead,
  Section,
  SourcePill,
} from "./AppShellShared";

export type DashboardDatePreset =
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_30d"
  | "this_month"
  | "last_month"
  | "custom";

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

type DashboardDateContextValue = {
  datePreset: DashboardDatePreset;
  metaPreviewQuery: string;
  activeLabel: string;
  activeSummary: string;
  setDatePreset: (value: DashboardDatePreset) => void;
};

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  roles?: UserRole[];
};

const OwnerModeContext = createContext<OwnerModeContextValue | null>(null);
const DashboardDisplayContext = createContext<DashboardDisplayContextValue | null>(null);
const DashboardDateContext = createContext<DashboardDateContextValue | null>(null);

const adminRoles: UserRole[] = ["owner", "admin"];

const navItems: NavItem[] = [
  { icon: Building2, label: "Portfolio", href: "/portfolio", roles: adminRoles },
  { icon: LayoutDashboard, label: "Command Center", href: "/" },
  { icon: ShieldCheck, label: "Business Health", href: "/health" },
  { icon: Target, label: "Funnel", href: "/funnel" },
  { icon: BarChart3, label: "Paid Media", href: "/paid-media" },
  { icon: Rocket, label: "Scaling", href: "/scaling" },
  { icon: Bell, label: "Actions", href: "/action" },
  { icon: Database, label: "Admin", href: "/admin", roles: adminRoles },
  { icon: Users, label: "Access Management", href: "/admin/access", roles: adminRoles },
  { icon: Palette, label: "Theme Settings", href: "/admin/theme", roles: adminRoles },
];

const dateOptions: Array<{ value: DashboardDatePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7d", label: "Last 7 days" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom", label: "Custom" },
];

function canSeeNavItem(item: NavItem, role: UserRole | null) {
  if (!item.roles) {
    return true;
  }

  return Boolean(role && item.roles.includes(role));
}

export function AppShell({
  children,
  portfolioMode = false,
}: {
  children: ReactNode;
  portfolioMode?: boolean;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: UserRole } | undefined)?.role ?? null;
  const isPrivileged = role === "owner" || role === "admin";
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClientId, setActiveClientId] = useState("");
  const [datePreset, setDatePresetState] = useState<DashboardDatePreset>("last_7d");

  useEffect(() => {
    const storedDatePreset = window.localStorage.getItem("media-dashboard-date-preset") as DashboardDatePreset | null;

    if (storedDatePreset && dateOptions.some((option) => option.value === storedDatePreset)) {
      setDatePresetState(storedDatePreset);
    }
  }, []);

  useEffect(() => {
    async function loadClients() {
      try {
        const storedClient = window.localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY);
        const query = storedClient ? `?clientId=${encodeURIComponent(storedClient)}` : "";
        const response = await fetch(`/api/admin/clients${query}`, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Client directory unavailable");
        }

        const payload = (await response.json()) as ClientDirectoryResponse;
        const nextClientId =
          storedClient && payload.clients.some((client) => client.id === storedClient)
            ? storedClient
            : payload.activeClientId;

        setClients(payload.clients);
        setActiveClientId(nextClientId);
      } catch {
        setClients([]);
        setActiveClientId("");
      }
    }

    if (status === "authenticated") {
      void loadClients();
    }
  }, [pathname, status]);

  const activeClient = useMemo(
    () => clients.find((client) => client.id === activeClientId) ?? clients[0] ?? null,
    [activeClientId, clients]
  );
  const currencyCode = activeClient?.currencyCode ?? "USD";
  const ownerContext = useMemo<OwnerModeContextValue>(
    () => ({
      ownerMode: isPrivileged,
      setOwnerMode: () => undefined,
    }),
    [isPrivileged]
  );
  const displayContext = useMemo<DashboardDisplayContextValue>(
    () => ({
      currencyCode,
      formatValue: (value: string) => formatMetricValue(value, currencyCode),
    }),
    [currencyCode]
  );
  const handleDatePresetChange = useCallback((value: DashboardDatePreset) => {
    setDatePresetState(value);
    window.localStorage.setItem("media-dashboard-date-preset", value);
    window.dispatchEvent(
      new CustomEvent("media-dashboard-date-change", {
        detail: { datePreset: value },
      })
    );
  }, []);

  const dateContext = useMemo<DashboardDateContextValue>(
    () => ({
      datePreset,
      metaPreviewQuery: `datePreset=${datePreset === "custom" ? "last_7d" : datePreset}`,
      activeLabel: dateOptions.find((option) => option.value === datePreset)?.label ?? "Last 7 days",
      activeSummary: getDateSummary(datePreset),
      setDatePreset: handleDatePresetChange,
    }),
    [datePreset, handleDatePresetChange]
  );
  const meta = getHeaderMeta(pathname);
  const clientLabel = portfolioMode ? "All configured stores" : activeClient?.name ?? "No client selected";
  const currencyLabel = portfolioMode ? "Portfolio scope" : getCurrencyMeta(currencyCode).label;
  const visibleNavItems = navItems.filter((item) => canSeeNavItem(item, role));
  return (
    <OwnerModeContext.Provider value={ownerContext}>
      <DashboardDisplayContext.Provider value={displayContext}>
        <DashboardDateContext.Provider value={dateContext}>
          <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
            <aside className="fixed left-0 top-0 hidden h-screen w-[300px] border-r border-[var(--line)] bg-[var(--bg-soft)] px-5 py-6 xl:flex xl:flex-col">
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white">
                    <Gauge size={24} />
                  </div>
                  <div>
                    <h2 className="font-serif-display text-2xl leading-none font-semibold">Operator OS</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">Media buying reporting workspace</p>
                  </div>
                </div>
              </div>

              <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-2">
                {visibleNavItems.map(({ icon: Icon, label, href }) => {
                  const active =
                    href === "/"
                      ? pathname === "/"
                      : href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        active
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-[var(--ink)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Signed in as
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                      {session?.user?.name ?? session?.user?.email ?? "Loading user"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {role ? getRoleLabel(role) : "Checking access"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: "/login" })}
                    className="rounded-full bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--ink)]"
                    aria-label="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </aside>

            <div className="xl:pl-[300px]">
              <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg-soft)] px-6 py-3 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <InfoChip>{clientLabel}</InfoChip>
                    <InfoChip>{currencyLabel}</InfoChip>
                    <InfoChip tone="good">Store sales truth first</InfoChip>
                    <InfoChip tone={isPrivileged ? "good" : "default"}>
                      {role ? getRoleLabel(role) : "Checking access"}
                    </InfoChip>
                  </div>

                  <HeaderUtilityControls
                    clients={clients}
                    activeClientId={activeClientId}
                    portfolioMode={portfolioMode}
                    datePreset={datePreset}
                    onClientChange={(clientId) => {
                      setActiveClientId(clientId);
                      persistActiveClient(clientId);
                    }}
                    onDatePresetChange={handleDatePresetChange}
                  />
                </div>

                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {meta.eyebrow}
                  </p>
                  <h1 className="mt-1 font-serif-display text-[25px] leading-tight font-semibold tracking-tight text-[var(--ink)] md:text-[31px]">
                    {meta.title}
                  </h1>
                  <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                    {meta.summary}
                  </p>
                </div>
              </header>

              <div className={`px-6 ${portfolioMode ? "py-3" : "py-4"}`}>{children}</div>
            </div>
          </main>
        </DashboardDateContext.Provider>
      </DashboardDisplayContext.Provider>
    </OwnerModeContext.Provider>
  );
}

function InfoChip({ children, tone = "default" }: { children: ReactNode; tone?: "good" | "default" }) {
  const style =
    tone === "good"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-900"
      : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]";

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${style}`}>{children}</span>;
}

type HeaderUtilityControlsProps = {
  clients: ClientRecord[];
  activeClientId: string;
  portfolioMode: boolean;
  datePreset: DashboardDatePreset;
  onClientChange: (clientId: string) => void;
  onDatePresetChange: (value: DashboardDatePreset) => void;
};

function HeaderUtilityControls({
  clients,
  activeClientId,
  portfolioMode,
  datePreset,
  onClientChange,
  onDatePresetChange,
}: HeaderUtilityControlsProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-dashboard-header-controls="reporting-window active-client"
    >
      <label className="flex items-center gap-2 rounded-[12px] border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
        <span className="uppercase tracking-[0.12em]">Reporting Window</span>
        <select
          value={datePreset}
          onChange={(event) => onDatePresetChange(event.target.value as DashboardDatePreset)}
          className="min-w-[132px] bg-transparent text-sm font-semibold text-[var(--ink)] outline-none"
          aria-label="Reporting window"
        >
          {dateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {!portfolioMode && clients.length ? (
        <select
          value={activeClientId}
          onChange={(event) => onClientChange(event.target.value)}
          className="rounded-[12px] border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm font-medium text-[var(--ink)] outline-none"
          aria-label="Active client"
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} · {client.currencyCode}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = /(good|strong|ready|connected|healthy|live|owner)/i.test(status)
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-900"
    : /(watch|review|weak|blocked|fix|missing|risk|partial)/i.test(status)
    ? "border-amber-500/25 bg-amber-500/10 text-amber-900"
    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]";

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
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

function getHeaderMeta(pathname: string) {
  if (pathname.startsWith("/admin/theme")) {
    return {
      eyebrow: "Theme System",
      title: "Theme Settings",
      summary: "Control dashboard colors and theme tokens safely from the admin workspace.",
    };
  }
  if (pathname.startsWith("/admin/access")) {
    return {
      eyebrow: "Access Control",
      title: "Access Management",
      summary: "Manage dashboard users, roles, and client access from one protected workspace.",
    };
  }
  if (pathname.startsWith("/admin")) {
    return {
      eyebrow: "Configuration",
      title: "Admin",
      summary: "Connect sources, map clients, and control the logic that powers the dashboard.",
    };
  }
  if (pathname.startsWith("/health")) {
    return {
      eyebrow: "Business Health",
      title: "Health intelligence",
      summary: "Read store truth, paid-media truth, and blended efficiency without hiding source limitations.",
    };
  }
  if (pathname.startsWith("/funnel")) {
    return {
      eyebrow: "Funnel",
      title: "Funnel diagnosis",
      summary: "Track funnel progression, missing truth layers, and where analytics needs stronger instrumentation.",
    };
  }
  if (pathname.startsWith("/paid-media")) {
    return {
      eyebrow: "Paid Media",
      title: "Paid-media control room",
      summary: "Review spend quality, platform attribution, and campaign-level operating signals.",
    };
  }
  if (pathname.startsWith("/scaling")) {
    return {
      eyebrow: "Scaling",
      title: "Scaling decisions",
      summary: "Turn business health and campaign signals into controlled scale, hold, or cut recommendations.",
    };
  }
  if (pathname.startsWith("/action")) {
    return {
      eyebrow: "Actions",
      title: "Action queue",
      summary: "Prioritize budget, tracking, and funnel fixes based on live risk and opportunity signals.",
    };
  }
  if (pathname.startsWith("/portfolio")) {
    return {
      eyebrow: "Portfolio",
      title: "Portfolio overview",
      summary: "Compare configured stores, currencies, and readiness across the client portfolio.",
    };
  }
  return {
    eyebrow: "Command Center",
    title: "Command center",
    summary: "A live operating surface that blends business truth, paid-media signals, and source readiness.",
  };
}

function formatMetricValue(value: string, currencyCode: ClientCurrencyCode) {
  if (currencyCode === "USD") {
    return value;
  }

  return value
    .replace(/\$/g, currencyCode === "AED" ? "AED " : `${currencyCode} `)
    .replace(/USD/g, currencyCode);
}

function getDateSummary(preset: DashboardDatePreset) {
  if (preset === "today") return "Today only";
  if (preset === "yesterday") return "Yesterday";
  if (preset === "last_30d") return "Trailing 30 days";
  if (preset === "this_month") return "Month to date";
  if (preset === "last_month") return "Previous full month";
  if (preset === "custom") return "Custom range pending";
  return "Trailing 7 days";
}
