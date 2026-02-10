"use client";

import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "#00BCD4",
  "#4CAF50",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#3F51B5",
  "#009688",
  "#F44336",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getInitials(firstName: string, lastName: string): string {
  const f = (firstName?.trim()[0] ?? "").toUpperCase();
  const l = (lastName?.trim()[0] ?? "").toUpperCase();
  return (f + l) || "?";
}

interface EmployeeAvatarProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function EmployeeAvatar({
  firstName,
  lastName,
  size = "default",
  className,
}: EmployeeAvatarProps) {
  const initials = getInitials(firstName, lastName);
  const colorIndex = hashString(firstName + lastName) % AVATAR_COLORS.length;
  const bgColor = AVATAR_COLORS[colorIndex];

  const sizeClass =
    size === "sm"
      ? "size-8 text-xs"
      : size === "lg"
        ? "size-12 text-base"
        : "size-10 text-sm";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizeClass,
        className
      )}
      style={{ backgroundColor: bgColor }}
      title={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}
