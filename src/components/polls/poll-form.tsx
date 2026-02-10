"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PollFormProps {
  authorId: string;
}

export function PollForm({ authorId }: PollFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => setOptions((o) => [...o, ""]);
  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((o) => o.filter((_, i) => i !== index));
  };
  const setOption = (index: number, value: string) => {
    setOptions((o) => {
      const next = [...o];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = options.map((s) => s.trim()).filter(Boolean);
    if (!title.trim()) {
      toast.error("Vyplňte titulek ankety");
      return;
    }
    if (trimmed.length < 2) {
      toast.error("Přidejte alespoň 2 možnosti");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          options: trimmed,
          authorId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Nepodařilo se vytvořit anketu");
        return;
      }
      toast.success("Anketa byla vytvořena");
      router.push("/polls");
      router.refresh();
    } catch {
      toast.error("Nepodařilo se vytvořit anketu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="poll-title">Titulek *</Label>
        <Input
          id="poll-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Např. Kam na teambuilding?"
          className="border-[var(--color-alveno-border)]"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="poll-desc">Popis (nepovinný)</Label>
        <Textarea
          id="poll-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Krátký popis ankety…"
          rows={2}
          className="border-[var(--color-alveno-border)] resize-y"
        />
      </div>
      <div className="space-y-2">
        <Label>Možnosti * (min. 2)</Label>
        <div className="space-y-2">
          {options.map((value, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={value}
                onChange={(e) => setOption(index, e.target.value)}
                placeholder={`Možnost ${index + 1}`}
                className="border-[var(--color-alveno-border)]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                aria-label="Odebrat možnost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          className="gap-1 border-[var(--color-alveno-accent)]"
        >
          <PlusIcon className="size-4" />
          Přidat možnost
        </Button>
      </div>
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[var(--color-alveno-success)] hover:bg-[var(--color-alveno-success-hover)] text-white rounded-lg"
          style={{ backgroundColor: "#4CAF50" }}
        >
          {submitting ? "Ukládám…" : "Vytvořit anketu"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/polls")}
          className="rounded-lg border-[var(--color-alveno-accent)]"
        >
          Zrušit
        </Button>
      </div>
    </form>
  );
}
