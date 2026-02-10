import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Smazání oznámení (např. pro admina) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Announcement DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nepodařilo se smazat" },
      { status: 500 }
    );
  }
}
