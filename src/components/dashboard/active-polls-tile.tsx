"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";
import { PollCard, type PollWithDetails } from "@/components/polls/poll-card";

interface ActivePollsTileProps {
  /** Maximální počet zobrazených anket */
  maxItems?: number;
}

export function ActivePollsTile({ maxItems = 3 }: ActivePollsTileProps) {
  const { employee, isAdmin } = useUser();
  const [list, setList] = useState<PollWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/polls");
      if (res.ok) {
        const data: PollWithDetails[] = await res.json();
        const active = data.filter((p) => p.isActive).slice(0, maxItems);
        setList(active);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleVote = useCallback(
    async (pollId: string, optionId: string) => {
      if (!employee?.id) return;
      const employeeId = employee.id;
      try {
        const res = await fetch(`/api/polls/${pollId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId, employeeId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error ?? "Hlasování se nepovedlo");
          throw new Error("Hlasování se nepovedlo");
        }
        fetchList();
      } catch (e) {
        throw e;
      }
    },
    [employee?.id, fetchList]
  );

  if (loading) {
    return (
      <div className="text-center py-4 text-[var(--color-alveno-text-light)] text-sm">
        Načítám ankety…
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-4 text-[var(--color-alveno-text-light)] text-sm">
        Zatím zde nejsou žádné aktivní ankety.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          currentEmployeeId={employee?.id ?? null}
          isAdmin={isAdmin}
          onVote={handleVote}
          onVoted={fetchList}
        />
      ))}
    </div>
  );
}
