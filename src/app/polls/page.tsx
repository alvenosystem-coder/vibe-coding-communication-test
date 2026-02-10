"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";
import { PollList } from "@/components/polls/poll-list";

export default function PollsPage() {
  const { isAdmin } = useUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[var(--color-alveno-text)]">
          Ankety
        </h2>
        {isAdmin && (
          <Button
            asChild
            className="bg-[var(--color-alveno-success)] hover:bg-[var(--color-alveno-success-hover)] text-white rounded-lg"
            style={{ backgroundColor: "#4CAF50" }}
          >
            <Link href="/polls/new" className="gap-2">
              <PlusIcon className="size-4" />
              Nová anketa
            </Link>
          </Button>
        )}
      </div>

      <PollList />
    </div>
  );
}
