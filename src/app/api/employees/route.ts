import { prisma, ensureDatabase } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Seznam zaměstnanců z lokální DB včetně oddělení (pro UserSwitcher). */
export async function GET() {
  try {
    await ensureDatabase();
    const employees = await prisma.employee.findMany({
      where: { isActive: true, isDisabled: false },
      include: { operation: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("Employees API error:", error);
    const message =
      error instanceof Error ? error.message : "Nepodařilo se načíst zaměstnance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
