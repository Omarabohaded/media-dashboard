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
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrencyMeta, type ClientCurrencyCode, type ClientRecord } from "@/lib/clientTypes";
import { getRoleLabel, type UserRole } from "@/lib/accessTypes";

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
        const storedClient = window.localStorage.getItem("media-dashboard-active-client");
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
  const dateContext = useMemo<DashboardDateContextValue>(
    () => ({
      datePreset,
      metaPreviewQuery: `datePreset=${datePreset === "custom" ? "last_7d" : datePreset}`,
      activeLabel: dateOptions.find((option) => option.value === datePreset)?.label ?? "Last 7 days",
      activeSummary: getDateSummary(datePreset),
      setDatePreset: (value: DashboardDatePreset) => {
        setDatePresetState(value);
        window.localStorage.setItem("media-dashboard-date-preset", value);
      },
    }),
    [datePreset]
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

                  {!portfolioMode && clients.length ? (
                    <select
                      value={activeClientId}
                      onChange={(event) => {
                        setActiveClientId(event.target.value);
                        window.localStorage.setItem("media-dashboard-active-client", event.target.value);
                      }}
                      className="rounded-[12px] border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm font-medium text-[var(--ink)] outline-none"
                    >
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} · {client.currencyCode}
                        </option>
                      ))}
                    </select>
                  ) : null}
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
      title: "Dashboard Themes",
      summary: "Switch the global dashboard palette from one controlled Admin workspace.",
    };
  }

  if (pathname.startsWith("/admin/access")) {
    return {
      eyebrow: "Access Control",
      title: "Access Management",
      summary: "Manage users, responsibilities, and client-level access without exposing setup controls to normal users.",
    };
  }

  if (pathname.startsWith("/portfolio") || pathname.startsWith("/multi-store")) {
    return {
      eyebrow: "Portfolio",
      title: "Multi-store Overview",
      summary: "Compare store performance quickly and rank the portfolio without losing operational context.",
    };
  }

  if (pathname.startsWith("/paid-media")) {
    return {
      eyebrow: "Channel Analysis",
      title: "Paid Media",
      summary: "Use this workspace for campaign delivery, cost, and efficiency reads.",
    };
  }

  if (pathname.startsWith("/health")) {
    return {
      eyebrow: "Business Truth",
      title: "Business Health",
      summary: "Check store truth, spend truth, and blended efficiency for decision-making.",
    };
  }

  if (pathname.startsWith("/funnel")) {
    return {
      eyebrow: "Conversion Analysis",
      title: "Funnel",
      summary: "Read where conversion performance weakens across the funnel.",
    };
  }

  if (pathname.startsWith("/scaling")) {
    return {
      eyebrow: "Decision Engine",
      title: "Scaling",
      summary: "Use scaling rules after source confidence is high enough to support bigger spend.",
    };
  }

  if (pathname.startsWith("/action")) {
    return {
      eyebrow: "Priority Lane",
      title: "Actions",
      summary: "See which risks and opportunities need attention first.",
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      eyebrow: "Configuration",
      title: "Admin",
      summary: "Connect sources, map clients, and control the logic that powers the dashboard.",
    };
  }

  return {
    eyebrow: "Operating Surface",
    title: "Command Center",
    summary: "Scan the active client quickly across business truth, paid-media truth, and priority signals.",
  };
}

function formatMetricValue(value: string, currencyCode: ClientCurrencyCode) {
  if (!value.startsWith("$")) {
    return value;
  }

  const parsed = Number(value.slice(1).replace(/,/g, ""));

  if (!Number.isFinite(parsed)) {
    return value;
  }

  const { locale } = getCurrencyMeta(currencyCode);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(parsed);
}

function getDateSummary(preset: DashboardDatePreset) {
  return dateOptions.find((option) => option.value === preset)?.label ?? "Last 7 days";
}
