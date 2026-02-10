"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";
import { Onboarding } from "./onboarding";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasEmployees, setHasEmployees] = useState<boolean | null>(null);

  // Embed widgety (např. /embed/polls) nemají sidebar / header – vracíme přímo obsah.
  if (pathname.startsWith("/embed")) {
    return <>{children}</>;
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/employees")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: unknown[]) => {
        if (!cancelled) setHasEmployees(Array.isArray(list) && list.length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasEmployees(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (hasEmployees === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-alveno-bg)]">
        <div className="text-[var(--color-alveno-text-light)]">Načítám…</div>
      </div>
    );
  }

  if (!hasEmployees) {
    return <Onboarding />;
  }

  return <AppShell>{children}</AppShell>;
}
