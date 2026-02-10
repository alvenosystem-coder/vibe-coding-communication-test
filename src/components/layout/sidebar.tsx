"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, MegaphoneIcon, BarChart3Icon } from "lucide-react";
import { UserSwitcher } from "./user-switcher";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Nástěnka", icon: LayoutDashboardIcon },
  { href: "/announcements", label: "Oznámení", icon: MegaphoneIcon },
  { href: "/polls", label: "Ankety", icon: BarChart3Icon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-[260px] shrink-0 flex-col bg-[var(--color-alveno-sidebar)]"
      style={{ backgroundColor: "#1B2A4A" }}
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold text-white">
          Komunikační centrum
        </h2>
      </div>
      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                "text-white hover:bg-[#00BCD4] hover:text-white",
                isActive && "bg-[#00BCD4]"
              )}
            >
              <Icon className="size-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <UserSwitcher />
      </div>
    </aside>
  );
}
