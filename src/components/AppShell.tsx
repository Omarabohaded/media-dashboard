"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarRange,
  Database,
  Gauge,
  LayoutDashboard,
  Palette,
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

type DashboardHeaderMeta = {
  eyebrow: string;
  title: string;
  summary: string;
};

export type DashboardDatePreset =
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_30d"
  | "this_month"
  | "last_month"
  | "custom";

export type DashboardCustomRange = {
  startDate: string;
  endDate: string;
};

type DashboardDateContextValue = {
  datePreset: DashboardDatePreset;
  metaPreviewQuery: string;
  activeLabel: string;
  activeSummary: string;
  setDatePreset: (value: DashboardDatePreset) => void;
};

type NavItem = {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  ownerOnly?: boolean;
};

const OwnerModeContext = createContext<OwnerModeContextValue | null>(null);
const DashboardDisplayContext =
  createContext<DashboardDisplayContextValue | null>(null);
const DashboardDateContext = createContext<DashboardDateContextValue | null>(null);

const DASHBOARD_DATE_PRESET_KEY = "media-dashboard-date-preset";
const DASHBOARD_CUSTOM_START_KEY = "media-dashboard-custom-start";
const DASHBOARD_CUSTOM_END_KEY = "media-dashboard-custom-end";

const NAV_ITEMS: NavItem[] = [
  { icon: Building2, label: "Portfolio", href: "/portfolio", ownerOnly: true },
  { icon: LayoutDashboard, label: "Command Center", href: "/" },
  { icon: ShieldCheck, label: "Business Health", href: "/health" },
  { icon: Target, label: "Funnel", href: "/funnel" },
  { icon: BarChart3, label: "Paid Media", href: "/paid-media" },
  { icon: Rocket, label: "Scaling", href: "/scaling" },
  { icon: Bell, label: "Actions", href: "/action" },
  { icon: Database, label: "Admin", href: "/admin" },
  {
    icon: Palette,
    label: "Theme Settings",
    href: "/admin/theme",
    ownerOnly: true,
  },
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
  { value: "custom", label: "Custom" },
];

export function AppShell({
  children,
  portfolioMode = false,
}: {
  children: React.ReactNode;
  portfolioMode?: boolean;
}) {
  const pathname = usePathname();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClientId, setActiveClientId] = useState("");
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [ownerMode, setOwnerModeState] = useState(false);
  const [datePreset, setDatePresetState] =
    useState<DashboardDatePreset>("last_7d");
  const [customRange, setCustomRangeState] = useState<DashboardCustomRange>(
    getDefaultCustomRange()
  );

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
    const savedCustomRange =
      typeof window !== "undefined" ? readStoredCustomRange() : null;

    setOwnerModeState(savedOwnerMode === "true");

    if (savedCustomRange) {
      setCustomRangeState(savedCustomRange);
    }

    if (
      savedDatePreset &&
      DATE_PRESET_OPTIONS.some((option) => option.value === savedDatePreset)
    ) {
      if (savedDatePreset === "custom" && !savedCustomRange) {
        setDatePresetState("last_7d");
      } else {
        setDatePresetState(savedDatePreset as DashboardDatePreset);
      }
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

    if (nextValue === "custom") {
      return;
    }

    window.localStorage.setItem(DASHBOARD_DATE_PRESET_KEY, nextValue);
  }

  return <>{children}</>;
}

function getDefaultCustomRange(): DashboardCustomRange {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);

  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate),
  };
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function readStoredCustomRange(): DashboardCustomRange | null {
  const startDate = window.localStorage.getItem(DASHBOARD_CUSTOM_START_KEY);
  const endDate = window.localStorage.getItem(DASHBOARD_CUSTOM_END_KEY);

  if (!startDate || !endDate) {
    return null;
  }

  return {
    startDate,
    endDate,
  };
}
