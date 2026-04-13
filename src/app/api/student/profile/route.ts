import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/jwt";

async function resolveStudentId(req: Request): Promise<string | null> {
  const token = extractToken(req);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "STUDENT") return null;
  return payload.sub;
}

export async function GET(req: Request) {
  try {
    const studentId = await resolveStudentId(req);
    if (!studentId) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identifier: true,
        classId: true,
        wpUrl: true,
        prestaUrl: true,
        class: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Étudiant introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      student: {
        ...student,
        name: `${student.firstName} ${student.lastName}`,
        classCode: student.class?.code || "NDRC",
      },
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const studentId = await resolveStudentId(req);
    if (!studentId) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const body = (await req.json()) as { wpUrl?: unknown; prestaUrl?: unknown };
    const data: { wpUrl?: string | null; prestaUrl?: string | null } = {};

    if (body.wpUrl !== undefined) {
      data.wpUrl = typeof body.wpUrl === "string" ? body.wpUrl.trim() : null;
    }
    if (body.prestaUrl !== undefined) {
      data.prestaUrl = typeof body.prestaUrl === "string" ? body.prestaUrl.trim() : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "Aucune donnée à mettre à jour" }, { status: 400 });
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data,
    });

    return NextResponse.json({
      success: true,
      student: updated,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
