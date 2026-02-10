import { testConnection } from "@/lib/alveno-api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ok = await testConnection();
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error("Alveno test error:", error);
    return NextResponse.json(
      { success: false, error: "Spojení se nepovedlo" },
      { status: 500 }
    );
  }
}
