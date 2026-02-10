"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2Icon, RefreshCwIcon, ShieldIcon } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";
import type { EmployeeWithOperation } from "@/types";
import { EmployeeAvatar } from "@/components/ui/employee-avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function UserSwitcher() {
  const { employee, isAdmin, setEmployee, setIsAdmin } = useUser();
  const [employees, setEmployees] = useState<EmployeeWithOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch {
      toast.error("Nepodařilo se načíst zaměstnance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/alveno/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Synchronizace selhala");
        return;
      }
      toast.success(
        `Synchronizováno: ${data.employees} zaměstnanců, ${data.operations} oddělení`
      );
      await loadEmployees();
    } catch {
      toast.error("Synchronizace selhala");
    } finally {
      setSyncing(false);
    }
  };

  const handleSelect = (e: EmployeeWithOperation) => {
    setEmployee(e);
    setOpen(false);
  };

  const handleAdminChange = (v: boolean) => {
    setIsAdmin(v);
    toast(v ? "Admin mód zapnut" : "Admin mód vypnut");
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 rounded-lg px-3 py-2 h-auto text-white hover:bg-[var(--color-alveno-sidebar-hover)]"
          >
            {employee ? (
              <>
                <EmployeeAvatar
                  firstName={employee.firstName}
                  lastName={employee.lastName}
                  size="sm"
                />
                <span className="truncate text-left">
                  {employee.firstName} {employee.lastName}
                </span>
                {isAdmin && (
                  <span className="ml-auto rounded bg-[var(--color-alveno-admin)] px-1.5 py-0.5 text-xs font-medium text-white">
                    ADMIN
                  </span>
                )}
              </>
            ) : (
              <span className="text-white/80">Přihlášen jako: Vyberte…</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Hledat zaměstnance..." />
            <CommandList>
              <CommandEmpty>
                {loading ? "Načítám…" : "Žádní zaměstnanci. Spusťte synchronizaci."}
              </CommandEmpty>
              <CommandGroup heading="Zaměstnanci">
                {employees.map((emp) => (
                  <CommandItem
                    key={emp.id}
                    value={`${emp.firstName} ${emp.lastName} ${emp.operation?.name ?? ""}`}
                    onSelect={() => handleSelect(emp)}
                    className="gap-2"
                  >
                    <EmployeeAvatar
                      firstName={emp.firstName}
                      lastName={emp.lastName}
                      size="sm"
                    />
                    <div className="flex flex-col">
                      <span>
                        {emp.firstName} {emp.lastName}
                      </span>
                      {emp.operation && (
                        <span className="text-xs text-muted-foreground">
                          {emp.operation.name}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <Separator />
          <div className="flex items-center justify-between gap-2 p-3">
            <Label htmlFor="admin-mode" className="flex items-center gap-2 text-sm">
              <ShieldIcon className="size-4" />
              Admin mód
            </Label>
            <Switch
              id="admin-mode"
              checked={isAdmin}
              onCheckedChange={handleAdminChange}
            />
          </div>
          {isAdmin && (
            <>
              <Separator />
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="size-4" />
                  )}
                  <span className="ml-2">Synchronizovat</span>
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
