import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Označení oznámení jako přečtené pro daného zaměstnance */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: announcementId } = await params;
    const body = await _request.json();
    const employeeId = (body?.employeeId as string)?.trim();
    if (!employeeId) {
      return NextResponse.json(
        { error: "Chybí employeeId" },
        { status: 400 }
      );
    }

    await prisma.announcementRead.upsert({
      where: {
        announcementId_employeeId: { announcementId, employeeId },
      },
      create: { announcementId, employeeId },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Announcement read error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chyba" },
      { status: 500 }
    );
  }
}

/** Zrušení označení přečtené – zaměstnanec označí, že ještě nečetl */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: announcementId } = await params;
    const { searchParams } = new URL(_request.url);
    const employeeId = searchParams.get("employeeId")?.trim();
    if (!employeeId) {
      return NextResponse.json(
        { error: "Chybí employeeId (query parametr)" },
        { status: 400 }
      );
    }

    await prisma.announcementRead.deleteMany({
      where: { announcementId, employeeId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Announcement unread error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chyba" },
      { status: 500 }
    );
  }
}
