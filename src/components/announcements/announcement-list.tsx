"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";
import { AnnouncementCard, type AnnouncementWithAuthor } from "./announcement-card";

export function AnnouncementList() {
  const { employee, isAdmin } = useUser();
  const [list, setList] = useState<AnnouncementWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async (retryCount = 0) => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setList(data);
      } else if (retryCount < 3) {
        // Retry mechanismus pro Vercel SQLite - zkus to znovu po chvíli
        setTimeout(() => fetchList(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
    } catch (error) {
      if (retryCount < 3) {
        // Retry mechanismus při chybě
        setTimeout(() => fetchList(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchList();
    
    // Automatické obnovení při návratu na stránku
    const handleFocus = () => {
      fetchList();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchList]);

  const handleMarkRead = useCallback(async (announcementId: string) => {
    if (!employee?.id) return;
    const employeeId = employee.id;
    try {
      await fetch(`/api/announcements/${announcementId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      setList((prev) =>
        prev.map((a) =>
          a.id === announcementId
            ? {
                ...a,
                readBy: [...a.readBy, { employeeId }],
              }
            : a
        )
      );
    } catch {
      // ignore
    }
  }, [employee?.id]);

  const handleMarkUnread = useCallback(async (announcementId: string) => {
    if (!employee?.id) return;
    const employeeId = employee.id;
    try {
      await fetch(
        `/api/announcements/${announcementId}/read?employeeId=${encodeURIComponent(employeeId)}`,
        { method: "DELETE" }
      );
      setList((prev) =>
        prev.map((a) =>
          a.id === announcementId
            ? {
                ...a,
                readBy: a.readBy.filter((r) => r.employeeId !== employeeId),
              }
            : a
        )
      );
    } catch {
      // ignore
    }
  }, [employee?.id]);

  const handleDelete = useCallback(async (announcementId: string) => {
    try {
      const res = await fetch(`/api/announcements/${announcementId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setList((prev) => prev.filter((a) => a.id !== announcementId));
      toast.success("Oznámení bylo smazáno");
    } catch {
      toast.error("Nepodařilo se smazat oznámení");
    }
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8 text-[var(--color-alveno-text-light)]">
        Načítám oznámení…
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-alveno-border)] bg-white p-8 text-center text-[var(--color-alveno-text-light)]">
        Zatím zde nejsou žádná oznámení.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {list.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          currentEmployeeId={employee?.id ?? null}
          isAdmin={isAdmin}
          onMarkRead={handleMarkRead}
          onMarkUnread={handleMarkUnread}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
