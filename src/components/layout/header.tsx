"use client";

import { usePathname } from "next/navigation";
import { BellIcon } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { EmployeeAvatar } from "@/components/ui/employee-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PATH_TITLES: Record<string, string> = {
  "/": "Nástěnka",
  "/announcements": "Oznámení",
  "/announcements/new": "Nové oznámení",
  "/polls": "Ankety",
  "/polls/new": "Nová anketa",
};

/** Počet nepřečtených notifikací (zatím statický placeholder) */
export function Header({ notificationCount = 0 }: { notificationCount?: number }) {
  const pathname = usePathname();
  const { employee, isAdmin } = useUser();
  const title = PATH_TITLES[pathname] ?? "Komunikační centrum";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-alveno-border)] bg-white px-6">
      <h1 className="text-lg font-semibold text-[var(--color-alveno-text)]">
        {title}
      </h1>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Notifikace"
        >
          <BellIcon className="size-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Button>
        <div className="flex items-center gap-2">
          {employee && (
            <>
              <EmployeeAvatar
                firstName={employee.firstName}
                lastName={employee.lastName}
                size="sm"
              />
              <span className="text-sm font-medium text-[var(--color-alveno-text)] hidden sm:inline">
                {employee.firstName} {employee.lastName}
              </span>
              {isAdmin && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-xs font-medium text-white hidden sm:inline"
                  )}
                  style={{ backgroundColor: "#9F7AEA" }}
                >
                  ADMIN
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
