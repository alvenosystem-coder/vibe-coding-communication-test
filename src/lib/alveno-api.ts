/**
 * Alveno HR API client – POUZE pro použití na serveru (API routes).
 * API klíč nikdy neposílat na frontend.
 */
import type { AlvenoEmployee, AlvenoOperation } from "@/types";
import { prisma } from "@/lib/prisma";

function getConfig() {
  const ALVENO_API_URL = process.env.ALVENO_API_URL;
  const ALVENO_API_KEY = process.env.ALVENO_API_KEY;
  const ALVENO_TENANT = process.env.ALVENO_TENANT;
  if (!ALVENO_API_URL?.startsWith("http")) {
    throw new Error(
      "Chybí ALVENO_API_URL v .env.local (např. https://hr.alveno.cz/api/external). Restartujte dev server po úpravě .env.local."
    );
  }
  if (!ALVENO_API_KEY || ALVENO_API_KEY === "sem_vlozit_api_klic") {
    throw new Error(
      "V .env.local nastavte platný ALVENO_API_KEY. Restartujte dev server po úpravě."
    );
  }
  if (!ALVENO_TENANT) {
    throw new Error("Chybí ALVENO_TENANT v .env.local (např. 06777198).");
  }
  return {
    ALVENO_API_URL,
    ALVENO_API_KEY,
    ALVENO_TENANT,
    headers: {
      "X-API-Key": ALVENO_API_KEY,
      "Content-Type": "application/json",
    },
  };
}

function baseUrl(url: string, tenant: string, path: string): string {
  return `${url}/v1/${tenant}${path}`;
}

/** Pomocná funkce – při chybě HTTP vrátí text z odpovědi */
async function errorFromResponse(res: Response, prefix: string): Promise<Error> {
  let body = "";
  try {
    body = await res.text();
  } catch {
    // ignore
  }
  const detail = body ? ` – ${body.slice(0, 200)}` : "";
  return new Error(`${prefix}: ${res.status} ${res.statusText}${detail}`);
}

/** Test spojení – GET /v1/{tenant}/echo?message=test */
export async function testConnection(): Promise<boolean> {
  const cfg = getConfig();
  try {
    const res = await fetch(baseUrl(cfg.ALVENO_API_URL, cfg.ALVENO_TENANT, "/echo?message=test"), {
      headers: cfg.headers,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { message?: string };
    return data.message === "test";
  } catch {
    return false;
  }
}

/** Stažení oddělení – GET /v1/{tenant}/operations */
export async function fetchOperations(): Promise<AlvenoOperation[]> {
  const cfg = getConfig();
  const res = await fetch(
    baseUrl(cfg.ALVENO_API_URL, cfg.ALVENO_TENANT, "/operations"),
    { headers: cfg.headers }
  );
  if (!res.ok) {
    throw await errorFromResponse(res, "Alveno API (operations)");
  }
  const data = (await res.json()) as { items: AlvenoOperation[] };
  return data.items ?? [];
}

/** Stažení všech zaměstnanců se stránkováním */
export async function fetchAllEmployees(): Promise<AlvenoEmployee[]> {
  const cfg = getConfig();
  const limit = 100;
  let offset = 0;
  const all: AlvenoEmployee[] = [];

  while (true) {
    const res = await fetch(
      baseUrl(
        cfg.ALVENO_API_URL,
        cfg.ALVENO_TENANT,
        `/employees?offset=${offset}&limit=${limit}`
      ),
      { headers: cfg.headers }
    );
    if (!res.ok) {
      throw await errorFromResponse(res, "Alveno API (employees)");
    }
    const data = (await res.json()) as {
      items: AlvenoEmployee[];
      totalCount: number;
    };
    const items = data.items ?? [];
    const active = items.filter(
      (e) => e.isActive === true && e.isDisabled === false
    );
    all.push(...active);
    if (offset + items.length >= (data.totalCount ?? 0)) break;
    offset += limit;
  }

  return all;
}

/** Kompletní synchronizace do lokální DB */
export async function syncAll(): Promise<{
  employees: number;
  operations: number;
}> {
  getConfig(); // ověření env na začátku
  const operations = await fetchOperations();
  for (const op of operations) {
    await prisma.operation.upsert({
      where: { id: op.id },
      create: {
        id: op.id,
        name: op.name,
        isDisabled: op.isDisabled ?? false,
      },
      update: {
        name: op.name,
        isDisabled: op.isDisabled ?? false,
      },
    });
  }

  const employees = await fetchAllEmployees();
  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      create: {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email ?? null,
        jobTitle: emp.jobTitle ?? "",
        personalNumber: emp.personalNumber ?? "",
        gender: emp.gender ?? "",
        isActive: emp.isActive ?? true,
        isDisabled: emp.isDisabled ?? false,
        operationId: emp.operationId ?? null,
      },
      update: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email ?? null,
        jobTitle: emp.jobTitle ?? "",
        personalNumber: emp.personalNumber ?? "",
        gender: emp.gender ?? "",
        isActive: emp.isActive ?? true,
        isDisabled: emp.isDisabled ?? false,
        operationId: emp.operationId ?? null,
      },
    });
  }

  return { employees: employees.length, operations: operations.length };
}
