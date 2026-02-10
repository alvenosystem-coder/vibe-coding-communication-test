"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";
import { AnnouncementList } from "@/components/announcements/announcement-list";

export default function AnnouncementsPage() {
  const { isAdmin } = useUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[var(--color-alveno-text)]">
          Oznámení
        </h2>
        {isAdmin && (
          <Button
            asChild
            className="bg-[var(--color-alveno-success)] hover:bg-[var(--color-alveno-success-hover)] text-white rounded-lg"
            style={{ backgroundColor: "#4CAF50" }}
          >
            <Link href="/announcements/new" className="gap-2">
              <PlusIcon className="size-4" />
              Nové oznámení
            </Link>
          </Button>
        )}
      </div>

      <AnnouncementList />
    </div>
  );
}
