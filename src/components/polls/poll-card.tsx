"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/components/ui/employee-avatar";
import { cn } from "@/lib/utils";

export interface PollWithDetails {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    operation: { name: string } | null;
  };
  options: { id: string; text: string; _count: { votes: number } }[];
  votes: { employeeId: string; optionId: string }[];
}

interface PollCardProps {
  poll: PollWithDetails;
  currentEmployeeId: string | null;
  isAdmin?: boolean;
  onVote?: (pollId: string, optionId: string) => void;
  onVoted?: () => void;
}

export function PollCard({
  poll,
  currentEmployeeId,
  isAdmin,
  onVote,
  onVoted,
}: PollCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localVotes, setLocalVotes] = useState<PollWithDetails["votes"] | null>(null);

  const userVote = localVotes !== null
    ? localVotes.find((v) => v.employeeId === currentEmployeeId)
    : poll.votes.find((v) => v.employeeId === currentEmployeeId);
  const hasVoted = !!userVote || isAdmin;
  const votes = localVotes ?? poll.votes;
  const totalVotes = poll.options.reduce(
    (sum, opt) => sum + (localVotes ? votes.filter((v) => v.optionId === opt.id).length : opt._count.votes),
    0
  );

  const handleSubmitVote = useCallback(async () => {
    if (!selectedOptionId || !currentEmployeeId || !onVote) return;
    setSubmitting(true);
    try {
      await onVote(poll.id, selectedOptionId);
      setLocalVotes([
        ...poll.votes.filter((v) => v.employeeId !== currentEmployeeId),
        { employeeId: currentEmployeeId, optionId: selectedOptionId },
      ]);
      onVoted?.();
    } finally {
      setSubmitting(false);
    }
  }, [poll.id, poll.votes, selectedOptionId, currentEmployeeId, onVote, onVoted]);

  const optionVoteCounts = poll.options.map((opt) => ({
    ...opt,
    count: localVotes
      ? votes.filter((v) => v.optionId === opt.id).length
      : opt._count.votes,
  }));

  return (
    <Card className="border-[var(--color-alveno-border)] transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-[var(--color-alveno-text)] pr-2">
            {poll.title}
          </h3>
          <Badge
            className={cn(
              poll.isActive
                ? "bg-[var(--color-alveno-success)] text-white"
                : "bg-gray-500/90 text-white"
            )}
          >
            {poll.isActive ? "Aktivní" : "Ukončená"}
          </Badge>
        </div>
        {poll.description && (
          <p className="text-sm text-[var(--color-alveno-text-light)]">
            {poll.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-[var(--color-alveno-text-light)]">
          <EmployeeAvatar
            firstName={poll.author.firstName}
            lastName={poll.author.lastName}
            size="sm"
          />
          <span>
            {poll.author.firstName} {poll.author.lastName}
            {poll.author.operation && (
              <span className="ml-1"> · {poll.author.operation.name}</span>
            )}
          </span>
        </div>
        <p className="text-xs text-[var(--color-alveno-text-light)]">
          {totalVotes} {totalVotes === 1 ? "hlas" : totalVotes < 5 ? "hlasy" : "hlasů"}
          {hasVoted && userVote && " · Hlasovali jste"}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {hasVoted || !poll.isActive ? (
          <div className="space-y-4">
            {optionVoteCounts.map((opt) => {
              const pct = totalVotes > 0 ? (opt.count / totalVotes) * 100 : 0;
              const isUserChoice = userVote?.optionId === opt.id;
              return (
                <div key={opt.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span
                      className={cn(isUserChoice && "font-medium")}
                      style={isUserChoice ? { color: "#00BCD4" } : undefined}
                    >
                      {opt.text}
                      {isUserChoice && " (váš hlas)"}
                    </span>
                    <span className="text-[var(--color-alveno-text-light)]">
                      {opt.count} ({pct.toFixed(0)} %)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: "#00BCD4" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {poll.options.map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                  selectedOptionId === opt.id
                    ? "border-[var(--color-alveno-accent)] bg-[var(--color-alveno-accent-light)]"
                    : "border-[var(--color-alveno-border)] hover:bg-gray-50"
                )}
                style={
                  selectedOptionId === opt.id
                    ? { borderColor: "#00BCD4", backgroundColor: "#E0F7FA" }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name={`poll-${poll.id}`}
                  value={opt.id}
                  checked={selectedOptionId === opt.id}
                  onChange={() => setSelectedOptionId(opt.id)}
                  className="size-4"
                />
                <span className="text-sm">{opt.text}</span>
              </label>
            ))}
            <Button
              onClick={handleSubmitVote}
              disabled={!selectedOptionId || submitting}
              className="bg-[var(--color-alveno-success)] hover:bg-[var(--color-alveno-success-hover)] text-white rounded-lg"
              style={{ backgroundColor: "#4CAF50" }}
            >
              {submitting ? "Odesílám…" : "Hlasovat"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
