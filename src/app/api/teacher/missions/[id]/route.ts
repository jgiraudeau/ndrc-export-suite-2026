import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/jwt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    
    const payload = await verifyToken(token);
    const { id } = await params;
    if (!payload || payload.role !== "TEACHER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                class: { select: { name: true } }
              }
            },
            journal: {
              orderBy: { date: "desc" }
            }
          }
        }
      }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: mission });
  } catch (err) {
    console.error("Teacher Mission Details API Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
