"use client";

import { PollList } from "@/components/polls/poll-list";

export default function EmbedPollsPage() {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-xl font-semibold text-[var(--color-alveno-text)]">
          Aktuální ankety
        </h2>
        <PollList />
      </div>
    </div>
  );
}
