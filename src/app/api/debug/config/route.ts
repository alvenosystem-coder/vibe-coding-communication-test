import { NextResponse } from "next/server";

/**
 * Diagnostický endpoint pro kontrolu konfigurace na Vercelu
 * Zobrazí, které environment variables jsou nastavené (bez zobrazení citlivých hodnot)
 */
export async function GET() {
  const config = {
    hasAlvenoApiUrl: !!process.env.ALVENO_API_URL,
    alvenoApiUrl: process.env.ALVENO_API_URL ? "✅ Nastaveno" : "❌ CHYBÍ",
    hasAlvenoApiKey: !!process.env.ALVENO_API_KEY,
    alvenoApiKey: process.env.ALVENO_API_KEY 
      ? `✅ Nastaveno (${process.env.ALVENO_API_KEY.substring(0, 20)}...)` 
      : "❌ CHYBÍ",
    hasAlvenoTenant: !!process.env.ALVENO_TENANT,
    alvenoTenant: process.env.ALVENO_TENANT || "❌ CHYBÍ",
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrl: process.env.DATABASE_URL ? "✅ Nastaveno" : "⚠️ Použije se /tmp/dev.db",
    isVercel: !!process.env.VERCEL,
    nodeEnv: process.env.NODE_ENV || "development",
  };

  const allSet = 
    config.hasAlvenoApiUrl && 
    config.hasAlvenoApiKey && 
    config.hasAlvenoTenant;

  return NextResponse.json({
    status: allSet ? "✅ Všechny env vars jsou nastavené" : "❌ CHYBÍ ENVIRONMENT VARIABLES",
    config,
    instructions: allSet 
      ? null 
      : {
          message: "Nastavte environment variables v Vercel dashboardu:",
          steps: [
            "1. Jděte do Vercel dashboardu → váš projekt",
            "2. Settings → Environment Variables",
            "3. Přidejte:",
            "   - ALVENO_API_URL=https://hr.alveno.cz/api/external",
            "   - ALVENO_API_KEY=vaš_api_klíč",
            "   - ALVENO_TENANT=06777198",
            "4. Redeploy projekt",
          ],
        },
  });
}
