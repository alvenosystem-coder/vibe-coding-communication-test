"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";
import { cn } from "@/lib/utils";
import { PollCard, type PollWithDetails } from "./poll-card";

export function PollList() {
  const { employee, isAdmin } = useUser();
  const [list, setList] = useState<PollWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/polls");
      if (res.ok) {
        const data = await res.json();
        setList(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleVote = useCallback(
    async (pollId: string, optionId: string) => {
      if (!employee?.id) return;
      const employeeId = employee.id;
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, employeeId }),
      });
      if (!res.ok) throw new Error("Hlasování se nepovedlo");
    },
    [employee?.id]
  );

  const handleDelete = useCallback(async (pollId: string) => {
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setList((prev) => prev.filter((p) => p.id !== pollId));
      toast.success("Anketa byla smazána");
    } catch {
      toast.error("Nepodařilo se smazat anketu");
    }
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8 text-[var(--color-alveno-text-light)]">
        Načítám ankety…
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-alveno-border)] bg-white p-8 text-center text-[var(--color-alveno-text-light)]">
        Zatím zde nejsou žádné ankety.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {list.map((poll) => (
        <div
          key={poll.id}
          className={cn(!poll.isActive && "opacity-75")}
        >
          <PollCard
            poll={poll}
            currentEmployeeId={employee?.id ?? null}
            isAdmin={isAdmin}
            onVote={handleVote}
            onVoted={fetchList}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </div>
  );
}
