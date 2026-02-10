"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";
import { AnnouncementCard, type AnnouncementWithAuthor } from "@/components/announcements/announcement-card";

interface UnreadAnnouncementsTileProps {
  /** Callback pro aktualizaci počtu nepřečtených (pro horní kartu) */
  onUnreadCountChange?: (count: number) => void;
  /** Maximální počet zobrazených oznámení */
  maxItems?: number;
}

export function UnreadAnnouncementsTile({
  onUnreadCountChange,
  maxItems = 5,
}: UnreadAnnouncementsTileProps) {
  const { employee, isAdmin, setEmployee } = useUser();
  const [list, setList] = useState<AnnouncementWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const autoLoadAttempted = useRef(false);

  // Automaticky načti prvního zaměstnance, pokud není nastavený (pouze jednou)
  useEffect(() => {
    if (!employee && !autoLoadAttempted.current) {
      autoLoadAttempted.current = true;
      fetch("/api/employees")
        .then((res) => res.json())
        .then((employees: Array<{ id: string; firstName: string; lastName: string }>) => {
          if (Array.isArray(employees) && employees.length > 0 && !employee) {
            setEmployee(employees[0] as any);
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }, [employee, setEmployee]);

  const fetchList = useCallback(async () => {
    if (!employee?.id) {
      setLoading(false);
      setList([]);
      return;
    }
    const employeeId = employee.id;
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data: AnnouncementWithAuthor[] = await res.json();
        const unread = data.filter(
          (a) => !a.readBy.some((r) => r.employeeId === employeeId)
        );
        setList(unread.slice(0, maxItems));
        onUnreadCountChange?.(unread.length);
      } else {
        setList([]);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [employee?.id, maxItems, onUnreadCountChange]);

  useEffect(() => {
    // Počkej malou chvíli, aby se employee mohl načíst z localStorage
    const timer = setTimeout(() => {
      fetchList();
    }, 100);
    return () => clearTimeout(timer);
  }, [employee?.id]); // Pouze když se změní employee ID, ne celý fetchList

  const handleMarkRead = useCallback(
    async (announcementId: string) => {
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
        fetchList();
      } catch {
        // ignore
      }
    },
    [employee?.id, fetchList]
  );

  const handleMarkUnread = useCallback(
    async (announcementId: string) => {
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
        fetchList();
      } catch {
        // ignore
      }
    },
    [employee?.id, fetchList]
  );

  if (loading) {
    return (
      <div className="text-center py-4 text-[var(--color-alveno-text-light)] text-sm">
        Načítám oznámení…
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-4 text-[var(--color-alveno-text-light)] text-sm">
        Není vybrán zaměstnanec. Prosím, vyberte zaměstnance v hlavní aplikaci.
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-4 text-[var(--color-alveno-text-light)] text-sm">
        Nemáte žádná nepřečtená oznámení.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          currentEmployeeId={employee?.id ?? null}
          isAdmin={isAdmin}
          onMarkRead={handleMarkRead}
          onMarkUnread={handleMarkUnread}
        />
      ))}
    </div>
  );
}
