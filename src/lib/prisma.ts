import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined;
  migrationsRun: boolean | undefined;
};

// Prisma 7 vyžaduje adapter. SQLite = better-sqlite3 adapter.
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Pro Vercel použij /tmp, jinak lokální prisma adresář
  const dbDir = process.env.VERCEL 
    ? "/tmp" 
    : path.join(process.cwd(), "prisma");
  const dbPath = path.join(dbDir, "dev.db");
  
  // Vytvoř adresář pokud neexistuje
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  databaseUrl = `file:${dbPath}`;
}

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

// SQL migrace - jednotlivé příkazy (Prisma nepodporuje více příkazů najednou)
const INIT_MIGRATION_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Operation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "jobTitle" TEXT NOT NULL DEFAULT '',
    "personalNumber" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "operationId" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Employee_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "AnnouncementRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "announcementId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Poll_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PollOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AnnouncementRead_announcementId_employeeId_key" ON "AnnouncementRead"("announcementId", "employeeId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Vote_pollId_employeeId_key" ON "Vote"("pollId", "employeeId")`,
];

// Funkce pro spuštění migrací pokud ještě neběžely
// Idempotentní: při každém startu projde všechny CREATE TABLE/INDEX příkazy
// a ignoruje "already exists" chyby – tím se dopočítají i nově přidané tabulky.
async function ensureMigrations() {
  if (globalForPrisma.migrationsRun) return;

  const tempPrisma = new PrismaClient({
    adapter,
    log: ["error"],
  });

  console.log("Ensuring database schema...");
  try {
    for (const statement of INIT_MIGRATION_STATEMENTS) {
      try {
        await tempPrisma.$executeRawUnsafe(statement);
      } catch (stmtError) {
        const errorMsg =
          stmtError instanceof Error ? stmtError.message : String(stmtError);
        // Ignoruj chyby typu "already exists" – tabulka/index už existuje
        if (
          !errorMsg.includes("already exists") &&
          !errorMsg.includes("duplicate")
        ) {
          console.warn(`Migration statement warning: ${errorMsg}`);
        }
      }
    }
    globalForPrisma.migrationsRun = true;
    console.log("Database schema ensured successfully");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    await tempPrisma.$disconnect();
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Spusť migrace při prvním použití (lazy initialization)
let migrationPromise: Promise<void> | null = null;
export async function ensureDatabase() {
  if (!migrationPromise) {
    migrationPromise = ensureMigrations();
  }
  await migrationPromise;
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
