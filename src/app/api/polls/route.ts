import { prisma, ensureDatabase } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Seznam anket s autorem, možnostmi a počty hlasů */
export async function GET() {
  try {
    await ensureDatabase();
    const polls = await prisma.poll.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        author: { include: { operation: true } },
        options: {
          include: { _count: { select: { votes: true } } },
        },
        votes: { select: { employeeId: true, optionId: true } },
      },
    });
    return NextResponse.json(polls);
  } catch (error) {
    console.error("Polls GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chyba při načítání" },
      { status: 500 }
    );
  }
}

/** Vytvoření ankety + notifikace pro všechny aktivní zaměstnance kromě autora */
export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const body = await request.json();
    const { title, description, options, authorId } = body as {
      title: string;
      description?: string;
      options: string[];
      authorId: string;
    };
    if (!title?.trim() || !Array.isArray(options) || options.length < 2 || !authorId) {
      return NextResponse.json(
        { error: "Chybí titulek, alespoň 2 možnosti nebo autor" },
        { status: 400 }
      );
    }
    const optionTexts = options.map((o: string) => String(o).trim()).filter(Boolean);
    if (optionTexts.length < 2) {
      return NextResponse.json(
        { error: "Anketa musí mít alespoň 2 možnosti" },
        { status: 400 }
      );
    }

    // Ověř, že zaměstnanec s authorId existuje v databázi
    const author = await prisma.employee.findUnique({
      where: { id: authorId },
      select: { id: true },
    });
    if (!author) {
      return NextResponse.json(
        { error: "Zaměstnanec neexistuje. Prosím, synchronizujte zaměstnance z HR systému." },
        { status: 400 }
      );
    }

    const poll = await prisma.poll.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        authorId,
        options: {
          create: optionTexts.map((text) => ({ text })),
        },
      },
      include: {
        author: { include: { operation: true } },
        options: true,
      },
    });

    const employees = await prisma.employee.findMany({
      where: { isActive: true, isDisabled: false, id: { not: authorId } },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: employees.map((e: { id: string }) => ({
        type: "poll",
        refId: poll.id,
        title: poll.title,
        employeeId: e.id,
      })),
    });

    return NextResponse.json(poll);
  } catch (error) {
    console.error("Polls POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chyba při ukládání" },
      { status: 500 }
    );
  }
}
