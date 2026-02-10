"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UnreadAnnouncementsTile } from "@/components/dashboard/unread-announcements-tile";
import { ActivePollsTile } from "@/components/dashboard/active-polls-tile";

export default function HomePage() {
  const { employee, isAdmin } = useUser();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [employeesCount, setEmployeesCount] = useState<number | null>(null);
  const [activePollsCount, setActivePollsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!employee?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [empRes, pollsRes] = await Promise.all([
        isAdmin ? fetch("/api/employees") : null,
        fetch("/api/polls"),
      ]);
      if (empRes?.ok) {
        const employees = await empRes.json();
        setEmployeesCount(Array.isArray(employees) ? employees.length : 0);
      } else if (!isAdmin) {
        setEmployeesCount(null);
      }
      if (pollsRes.ok) {
        const polls: { isActive: boolean }[] = await pollsRes.json();
        setActivePollsCount(polls.filter((p) => p.isActive).length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [employee?.id, isAdmin]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-alveno-text)]">
          Dobrý den, {employee ? `${employee.firstName}!` : "…"}
        </h2>
        {employee?.operation && (
          <p className="text-sm text-[var(--color-alveno-text-light)]">
            {employee.operation?.name}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[var(--color-alveno-border)]">
          <CardHeader className="pb-2 text-sm font-medium text-[var(--color-alveno-text-light)]">
            Nových oznámení
          </CardHeader>
          <CardContent>
            {loading && employee ? (
              <span className="text-2xl font-bold text-[var(--color-alveno-text-light)]">—</span>
            ) : (
              <span className="text-2xl font-bold">{unreadCount}</span>
            )}
          </CardContent>
        </Card>
        <Card className="border-[var(--color-alveno-border)]">
          <CardHeader className="pb-2 text-sm font-medium text-[var(--color-alveno-text-light)]">
            Aktivních anket
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{activePollsCount}</span>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-alveno-border)]">
          <CardHeader className="pb-2 text-sm font-medium text-[var(--color-alveno-text-light)]">
            Zaměstnanců
          </CardHeader>
          <CardContent>
            {isAdmin && employeesCount !== null ? (
              <span className="text-2xl font-bold">{employeesCount}</span>
            ) : (
              <span className="text-2xl font-bold">—</span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[var(--color-alveno-border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Nepřečtená oznámení</CardTitle>
            <Button variant="link" className="text-[var(--color-alveno-accent)]" asChild>
              <Link href="/announcements">Zobrazit vše →</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <UnreadAnnouncementsTile
              onUnreadCountChange={setUnreadCount}
              maxItems={5}
            />
          </CardContent>
        </Card>

        <Card className="border-[var(--color-alveno-border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Hlasování</CardTitle>
            <Button variant="link" className="text-[var(--color-alveno-accent)]" asChild>
              <Link href="/polls">Zobrazit vše →</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ActivePollsTile maxItems={3} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
