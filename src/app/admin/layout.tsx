"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ACTIVE_CLIENT_STORAGE_KEY } from "@/lib/clientContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={children}>
      <AdminClientQuerySync>{children}</AdminClientQuerySync>
    </Suspense>
  );
}

function AdminClientQuerySync({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== "/admin") {
      return;
    }

    const storedClientId = window.localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY);

    if (!storedClientId) {
      return;
    }

    const currentClientId = searchParams.get("clientId");

    if (currentClientId === storedClientId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("clientId", storedClientId);
    window.location.replace(`${pathname}?${nextParams.toString()}`);
  }, [pathname, searchParams]);

  return <>{children}</>;
}
