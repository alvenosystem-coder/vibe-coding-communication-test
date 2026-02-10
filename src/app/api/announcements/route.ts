import { prisma, ensureDatabase } from "@/lib/prisma";
import { syncAll } from "@/lib/alveno-api";
import { NextResponse } from "next/server";

/** Seznam oznámení s autorem a oddělením, od nejnovějších */
export async function GET() {
  try {
    await ensureDatabase();
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { include: { operation: true } },
        readBy: { select: { employeeId: true } },
      },
    });
    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Announcements GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chyba při načítání" },
      { status: 500 }
    );
  }
}

/** Vytvoření oznámení + notifikace pro všechny aktivní zaměstnance kromě autora */
export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const body = await request.json();
    const { title, content, priority, authorId } = body as {
      title: string;
      content: string;
      priority?: string;
      authorId: string;
    };
    if (!title?.trim() || !content?.trim() || !authorId) {
      return NextResponse.json(
        { error: "Chybí titulek, obsah nebo autor" },
        { status: 400 }
      );
    }
    // Ověř, že zaměstnanec s authorId existuje v databázi
    let author = await prisma.employee.findUnique({
      where: { id: authorId },
      select: { id: true },
    });
    
    // Pokud zaměstnanec neexistuje, zkus automatickou synchronizaci (databáze mohla být resetována)
    if (!author) {
      console.log("Zaměstnanec neexistuje, spouštím automatickou synchronizaci...");
      try {
        await syncAll();
        // Zkus znovu najít zaměstnance
        author = await prisma.employee.findUnique({
          where: { id: authorId },
          select: { id: true },
        });
      } catch (syncError) {
        console.error("Automatická synchronizace selhala:", syncError);
      }
      
      // Pokud stále neexistuje, vrať chybu
      if (!author) {
        return NextResponse.json(
          { 
            error: "Zaměstnanec neexistuje. Databáze byla pravděpodobně resetována. Zkuste obnovit stránku a synchronizovat zaměstnance.",
            hint: "Na Vercelu se databáze resetuje mezi deploymenty. Pro perzistentní data použijte Vercel Postgres."
          },
          { status: 400 }
        );
      }
    }

    const pr: "low" | "normal" | "high" | "urgent" = 
      priority && ["low", "normal", "high", "urgent"].includes(priority)
        ? (priority as "low" | "normal" | "high" | "urgent")
        : "normal";

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        priority: pr,
        authorId,
      },
      include: {
        author: { include: { operation: true } },
      },
    });

    const employees = await prisma.employee.findMany({
      where: { isActive: true, isDisabled: false, id: { not: authorId } },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: employees.map((e: { id: string }) => ({
        type: "announcement",
        refId: announcement.id,
        title: announcement.title,
        employeeId: e.id,
      })),
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Announcements POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chyba při ukládání" },
      { status: 500 }
    );
  }
}
