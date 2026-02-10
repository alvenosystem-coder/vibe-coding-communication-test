"use client";

import { UnreadAnnouncementsTile } from "@/components/dashboard/unread-announcements-tile";

export default function EmbedUnreadAnnouncementsPage() {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-xl font-semibold text-[var(--color-alveno-text)]">
          Nepřečtená oznámení
        </h2>
        <UnreadAnnouncementsTile maxItems={10} />
      </div>
    </div>
  );
}

