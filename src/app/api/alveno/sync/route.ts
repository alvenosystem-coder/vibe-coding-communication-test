import { syncAll } from "@/lib/alveno-api";
import { ensureDatabase } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Zajisti, že databáze existuje a migrace jsou spuštěny
    await ensureDatabase();
    const result = await syncAll();
    return NextResponse.json({
      success: true,
      employees: result.employees,
      operations: result.operations,
    });
  } catch (error) {
    console.error("Alveno sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Synchronizace selhala",
      },
      { status: 500 }
    );
  }
}
