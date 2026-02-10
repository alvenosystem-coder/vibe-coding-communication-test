"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementForm } from "@/components/announcements/announcement-form";

export default function NewAnnouncementPage() {
  const { employee, isAdmin } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (employee === undefined) return;
    if (!employee) {
      router.replace("/announcements");
      return;
    }
    if (!isAdmin) {
      router.replace("/announcements");
    }
  }, [employee, isAdmin, router]);

  if (employee === undefined || !employee || !isAdmin) {
    return (
      <div className="text-[var(--color-alveno-text-light)]">Načítám…</div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[var(--color-alveno-text)]">
        Nové oznámení
      </h2>
      <Card className="border-[var(--color-alveno-border)]">
        <CardHeader>
          <CardTitle className="text-lg">Zadejte údaje</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm authorId={employee.id} />
        </CardContent>
      </Card>
    </div>
  );
}
