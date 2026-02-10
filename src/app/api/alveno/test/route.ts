import { testConnection } from "@/lib/alveno-api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ok = await testConnection();
    return NextResponse.json({ 
      success: ok,
      message: ok ? "✅ Spojení s Alveno API funguje" : "❌ Spojení selhalo"
    });
  } catch (error) {
    console.error("Alveno test error:", error);
    const errorMessage = error instanceof Error ? error.message : "Neznámá chyba";
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        hint: "Zkontrolujte /api/alveno/diagnose pro detailní informace o environment variables"
      },
      { status: 500 }
    );
  }
}
