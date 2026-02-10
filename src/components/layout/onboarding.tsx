"use client";

import { useState } from "react";
import { Loader2Icon, RocketIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function Onboarding() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alveno/sync", { method: "POST" });
      let data: { error?: string; employees?: number; operations?: number } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        toast.error(data.error ?? `Synchronizace selhala (${res.status})`);
        setLoading(false);
        return;
      }
      toast.success(
        `Synchronizováno: ${data.employees} zaměstnanců, ${data.operations} oddělení`
      );
      window.location.href = "/";
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Synchronizace selhala";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-alveno-bg)] px-4" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-md text-center">
        <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-[var(--color-alveno-accent)] text-4xl text-white" style={{ backgroundColor: "#00BCD4" }}>
          <RocketIcon className="size-10" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-alveno-text)]">
          Vítejte v Komunikačním centru
        </h1>
        <p className="mt-3 text-[var(--color-alveno-text-light)]">
          Pro začátek je potřeba načíst zaměstnance z HR systému Alveno. Po změně
          .env.local restartujte dev server (npm run dev).
        </p>
        <Button
          size="lg"
          className="mt-8 bg-[var(--color-alveno-success)] hover:bg-[var(--color-alveno-success-hover)] text-white"
          style={{ backgroundColor: "#4CAF50" }}
          onClick={handleSync}
          disabled={loading}
        >
          {loading ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <RocketIcon className="size-5" />
          )}
          <span className="ml-2">
            {loading ? "Synchronizuji…" : "Načíst zaměstnance z Alveno HR"}
          </span>
        </Button>
      </div>
    </div>
  );
}
