import { prisma, ensureDatabase } from "@/lib/prisma";
import { syncAll } from "@/lib/alveno-api";
import { NextResponse } from "next/server";

/** Seznam zaměstnanců z lokální DB včetně oddělení (pro UserSwitcher). */
export async function GET() {
  try {
    await ensureDatabase();
    
    // Zkontroluj, jestli jsou v databázi nějací zaměstnanci
    const employeeCount = await prisma.employee.count({
      where: { isActive: true, isDisabled: false },
    });
    
    // Pokud databáze je prázdná (typicky po resetu na Vercelu), automaticky synchronizuj
    if (employeeCount === 0) {
      console.log("Databáze je prázdná, spouštím automatickou synchronizaci zaměstnanců...");
      try {
        await syncAll();
        console.log("Automatická synchronizace dokončena");
      } catch (syncError) {
        console.error("Automatická synchronizace selhala:", syncError);
        // Pokračuj i když synchronizace selhala - možná je problém s API
      }
    }
    
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
