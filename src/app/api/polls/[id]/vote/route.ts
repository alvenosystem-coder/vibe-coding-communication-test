import { prisma, ensureDatabase } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Odeslání hlasu (jedna možnost na anketu na zaměstnance) */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabase();
    const { id: pollId } = await params;
    const body = await request.json();
    const { optionId, employeeId } = body as { optionId: string; employeeId: string };
    if (!optionId?.trim() || !employeeId?.trim()) {
      return NextResponse.json(
        { error: "Chybí optionId nebo employeeId" },
        { status: 400 }
      );
    }

    const option = await prisma.pollOption.findFirst({
      where: { id: optionId, pollId },
    });
    if (!option) {
      return NextResponse.json(
        { error: "Neplatná možnost pro tuto anketu" },
        { status: 400 }
      );
    }

    await prisma.vote.upsert({
      where: {
        pollId_employeeId: { pollId, employeeId },
      },
      create: { pollId, optionId, employeeId },
      update: { optionId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Vote POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chyba při hlasování" },
      { status: 500 }
    );
  }
}
