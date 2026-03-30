import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "TEACHER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const teacherId = payload.sub;

    const students = await prisma.student.findMany({
      where: { teacherId },
      include: {
        class: true,
        progress: {
          select: {
            acquired: true,
            teacherStatus: true
          }
        }
      },
      orderBy: { lastName: "asc" }
    });

    const studentList = students.map(s => {
      const total = s.progress.length || 40;
      const completed = s.progress.filter(p => p.teacherStatus != null).length;
      const percentage = Math.round((completed / total) * 100);

      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        class: s.class.code,
        completion: percentage,
        initials: `${s.firstName[0]}${s.lastName[0]}`.toUpperCase()
      };
    });

    return NextResponse.json({ success: true, students: studentList });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
