"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PollForm } from "@/components/polls/poll-form";

export default function NewPollPage() {
  const { employee, isAdmin } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (employee === undefined) return;
    if (!employee) {
      router.replace("/polls");
      return;
    }
    if (!isAdmin) {
      router.replace("/polls");
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
        Nová anketa
      </h2>
      <Card className="border-[var(--color-alveno-border)]">
        <CardHeader>
          <CardTitle className="text-lg">Zadejte údaje</CardTitle>
        </CardHeader>
        <CardContent>
          <PollForm authorId={employee.id} />
        </CardContent>
      </Card>
    </div>
  );
}
