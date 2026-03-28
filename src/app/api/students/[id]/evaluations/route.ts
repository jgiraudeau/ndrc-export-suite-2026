import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const token = extractToken(req);
    const auth = await verifyToken(token || "");
    if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Fetch all progress records starting with E4 or E6
    const progress = await prisma.progress.findMany({
      where: {
        studentId,
        OR: [
          { competencyId: { startsWith: "E4." } },
          { competencyId: { startsWith: "E6." } }
        ]
      }
    });

    // Grouping by type (E4/E6)
    // In a real scenario, we might have multiple evaluation sessions.
    // For now, we return a virtual evaluation object based on latest progress.
    
    const e4Scores = progress
      .filter(p => p.competencyId.startsWith("E4."))
      .map(p => ({
        criterionId: p.competencyId,
        score: p.teacherStatus || 0,
        comment: p.teacherFeedback
      }));

    const e6Scores = progress
      .filter(p => p.competencyId.startsWith("E6."))
      .map(p => ({
        criterionId: p.competencyId,
        score: p.teacherStatus || 0,
        comment: p.teacherFeedback
      }));

    const evaluations = [];
    if (e4Scores.length > 0) {
      evaluations.push({
        id: "v-e4-" + studentId,
        type: "E4",
        date: new Date().toISOString(),
        globalComment: "Suivi continu E4",
        scores: e4Scores
      });
    }
    if (e6Scores.length > 0) {
      evaluations.push({
        id: "v-e6-" + studentId,
        type: "E6",
        date: new Date().toISOString(),
        globalComment: "Suivi continu E6",
        scores: e6Scores
      });
    }

    return NextResponse.json(evaluations);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
