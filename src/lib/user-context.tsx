"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { EmployeeWithOperation } from "@/types";

const STORAGE_EMPLOYEE = "kom-centrum-employee";
const STORAGE_ADMIN = "kom-centrum-admin";

interface UserContextValue {
  employee: EmployeeWithOperation | null;
  isAdmin: boolean;
  setEmployee: (e: EmployeeWithOperation | null) => void;
  setIsAdmin: (v: boolean) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployeeState] = useState<EmployeeWithOperation | null>(
    null
  );
  const [isAdmin, setIsAdminState] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_EMPLOYEE);
      if (raw) {
        const parsed = JSON.parse(raw) as EmployeeWithOperation;
        setEmployeeState(parsed);
      }
      const admin = localStorage.getItem(STORAGE_ADMIN);
      setIsAdminState(admin === "true");
    } catch {
      // ignore
    }
  }, []);

  const setEmployee = useCallback((e: EmployeeWithOperation | null) => {
    setEmployeeState(e);
    if (e) {
      localStorage.setItem(STORAGE_EMPLOYEE, JSON.stringify(e));
    } else {
      localStorage.removeItem(STORAGE_EMPLOYEE);
    }
  }, []);

  const setIsAdmin = useCallback((v: boolean) => {
    setIsAdminState(v);
    localStorage.setItem(STORAGE_ADMIN, v ? "true" : "false");
  }, []);

  const value = useMemo(
    () => ({ employee, isAdmin, setEmployee, setIsAdmin }),
    [employee, isAdmin, setEmployee, setIsAdmin]
  );

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
