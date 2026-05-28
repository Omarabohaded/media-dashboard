"use client";

import { useEffect } from "react";

const STORAGE_KEY = "media-dashboard-theme";

export type DashboardTheme = "default" | "executive";

export function applyDashboardTheme(theme: DashboardTheme) {
  document.documentElement.setAttribute("data-dashboard-theme", theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export default function DashboardThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const storedTheme =
      (window.localStorage.getItem(STORAGE_KEY) as DashboardTheme | null) ?? "default";

    document.documentElement.setAttribute("data-dashboard-theme", storedTheme);
  }, []);

  return <>{children}</>;
}
