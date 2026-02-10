"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnnouncementPriority } from "@/types";

const PRIORITIES: { value: AnnouncementPriority; label: string }[] = [
  { value: "low", label: "Nízká" },
  { value: "normal", label: "Normální" },
  { value: "high", label: "Vysoká" },
  { value: "urgent", label: "Urgentní" },
];

interface AnnouncementFormProps {
  authorId: string;
}

export function AnnouncementForm({ authorId }: AnnouncementFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Vyplňte titulek a obsah");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          priority,
          authorId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Nepodařilo se vytvořit oznámení");
        return;
      }
      toast.success("Oznámení bylo vytvořeno");
      router.push("/announcements");
      router.refresh();
    } catch {
      toast.error("Nepodařilo se vytvořit oznámení");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Titulek *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Např. Firemní vánoční večírek"
          className="border-[var(--color-alveno-border)]"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Obsah *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Text oznámení…"
          rows={6}
          className="border-[var(--color-alveno-border)] resize-y"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="priority">Priorita</Label>
        <Select
          value={priority}
          onValueChange={(v) => setPriority(v as AnnouncementPriority)}
        >
          <SelectTrigger
            id="priority"
            className="border-[var(--color-alveno-border)]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[var(--color-alveno-success)] hover:bg-[var(--color-alveno-success-hover)] text-white rounded-lg"
          style={{ backgroundColor: "#4CAF50" }}
        >
          {submitting ? "Ukládám…" : "Vytvořit oznámení"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/announcements")}
          className="rounded-lg border-[var(--color-alveno-accent)]"
        >
          Zrušit
        </Button>
      </div>
    </form>
  );
}
