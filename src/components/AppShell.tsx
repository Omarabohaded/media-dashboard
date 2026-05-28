"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  Database,
  Gauge,
  LayoutDashboard,
  Palette,
  Rocket,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrencyMeta, type ClientCurrencyCode, type ClientRecord } from "@/lib/clientTypes";

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
  ownerOnly?: boolean;
};

const OwnerModeContext = createContext<OwnerModeContextValue | null>(null);
const DashboardDisplayContext = createContext<DashboardDisplayContextValue | null>(null);
const DashboardDateContext = createContext<DashboardDateContextValue | null>(null);

const navItems: NavItem[] = [
  { icon: Building2, label: "Portfolio", href: "/portfolio", ownerOnly: true },
  { icon: LayoutDashboard, label: "Command Center", href: "/" },
  { icon: ShieldCheck, label: "Business Health", href: "/health" },
  { icon: Target, label: "Funnel", href: "/funnel" },
  { icon: BarChart3, label: "Paid Media", href: "/paid-media" },
  { icon: Rocket, label: "Scaling", href: "/scaling" },
  { icon: Bell, label: "Actions", href: "/action" },
  { icon: Database, label: "Admin", href: "/admin" },
  { icon: Palette, label: "Theme Settings", href: "/admin/theme", ownerOnly: true },
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
