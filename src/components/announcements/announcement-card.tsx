"use client";

import { useState, useCallback } from "react";
import { Trash2Icon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmployeeAvatar } from "@/components/ui/employee-avatar";
import { cn } from "@/lib/utils";
import type { AnnouncementPriority } from "@/types";

const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  low: "Nízká",
  normal: "Normální",
  high: "Vysoká",
  urgent: "Urgentní",
};

const PRIORITY_STYLES: Record<AnnouncementPriority, string> = {
  low: "bg-gray-500/90 text-white",
  normal: "bg-blue-500/90 text-white",
  high: "bg-[var(--color-alveno-warning)] text-white",
  urgent: "bg-[var(--color-alveno-danger)] text-white animate-pulse",
};

export interface AnnouncementWithAuthor {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    operation: { name: string } | null;
  };
  readBy: { employeeId: string }[];
}

interface AnnouncementCardProps {
  announcement: AnnouncementWithAuthor;
  currentEmployeeId: string | null;
  isAdmin?: boolean;
  onMarkRead?: (announcementId: string) => void;
  onMarkUnread?: (announcementId: string) => void;
  onDelete?: (announcementId: string) => void;
}

const CONTENT_PREVIEW_LENGTH = 150;

export function AnnouncementCard({
  announcement,
  currentEmployeeId,
  isAdmin,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isRead =
    !currentEmployeeId ||
    announcement.readBy.some((r) => r.employeeId === currentEmployeeId);
  const priority = (announcement.priority || "normal") as AnnouncementPriority;
  const priorityStyle = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.normal;
  const priorityLabel = PRIORITY_LABELS[priority] ?? announcement.priority;

  const handleToggle = useCallback(() => {
    setExpanded((e) => !e);
    if (!expanded && !isRead && currentEmployeeId && onMarkRead) {
      onMarkRead(announcement.id);
    }
  }, [expanded, isRead, currentEmployeeId, onMarkRead, announcement.id]);

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      if (!currentEmployeeId) return;
      if (checked) {
        onMarkRead?.(announcement.id);
      } else {
        onMarkUnread?.(announcement.id);
      }
    },
    [currentEmployeeId, announcement.id, onMarkRead, onMarkUnread]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onDelete) return;
      if (window.confirm("Opravdu smazat toto oznámení?")) {
        onDelete(announcement.id);
      }
    },
    [announcement.id, onDelete]
  );

  const preview =
    announcement.content.length <= CONTENT_PREVIEW_LENGTH
      ? announcement.content
      : announcement.content.slice(0, CONTENT_PREVIEW_LENGTH) + "…";

  const displayContent = expanded ? announcement.content : preview;
  const showMore = announcement.content.length > CONTENT_PREVIEW_LENGTH;

  return (
    <Card
      className="cursor-pointer border-[var(--color-alveno-border)] transition-shadow hover:shadow-md"
      onClick={handleToggle}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-[var(--color-alveno-text)] pr-2">
            {announcement.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {currentEmployeeId && (
              <label
                className="flex items-center gap-1.5 text-sm text-[var(--color-alveno-text-light)] cursor-pointer select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isRead}
                  onCheckedChange={(v) => handleCheckboxChange(v === true)}
                  aria-label="Přečteno"
                />
                Přečteno
              </label>
            )}
            {isAdmin && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-[var(--color-alveno-danger)] hover:bg-red-50 hover:text-[var(--color-alveno-danger)]"
                onClick={handleDelete}
                aria-label="Smazat oznámení"
              >
                <Trash2Icon className="size-4" />
              </Button>
            )}
            <Badge className={cn(priorityStyle)}>
              {priorityLabel}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-alveno-text-light)]">
          <EmployeeAvatar
            firstName={announcement.author.firstName}
            lastName={announcement.author.lastName}
            size="sm"
          />
          <span>
            {announcement.author.firstName} {announcement.author.lastName}
            {announcement.author.operation && (
              <span className="ml-1"> · {announcement.author.operation.name}</span>
            )}
          </span>
        </div>
        <p className="text-xs text-[var(--color-alveno-text-light)]">
          {new Date(announcement.createdAt).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="whitespace-pre-wrap text-sm text-[var(--color-alveno-text)]">
          {displayContent}
        </p>
        {showMore && !expanded && (
          <p className="mt-1 text-sm text-[var(--color-alveno-accent)]">
            Zobrazit více…
          </p>
        )}
      </CardContent>
    </Card>
  );
}
