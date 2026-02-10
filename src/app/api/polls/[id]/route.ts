import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Smazání ankety (např. pro admina) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.poll.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Poll DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nepodařilo se smazat" },
      { status: 500 }
    );
  }
}
