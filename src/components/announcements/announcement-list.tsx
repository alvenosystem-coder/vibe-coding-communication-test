"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";
import { AnnouncementCard, type AnnouncementWithAuthor } from "./announcement-card";

export function AnnouncementList() {
  const { employee, isAdmin } = useUser();
  const [list, setList] = useState<AnnouncementWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
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
