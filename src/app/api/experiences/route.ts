import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/experiences?studentId=... or ?classId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");

    if (studentId) {
      const experiences = await prisma.professionalExperience.findMany({
        where: { studentId },
        include: { journal: { orderBy: { date: "desc" } } },
        orderBy: { startDate: "desc" },
      });
      return NextResponse.json(experiences);
    }

    if (classId) {
      const experiences = await prisma.professionalExperience.findMany({
        where: {
          student: { classId }
        },
        include: {
          student: {
            select: { firstName: true, lastName: true }
          },
          journal: { orderBy: { date: "desc" } }
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(experiences);
    }

    return NextResponse.json({ error: "Missing studentId or classId" }, { status: 400 });
  } catch (error) {
    console.error("GET experiences error:", error);
    return NextResponse.json({ error: "Failed to fetch experiences" }, { status: 500 });
  }
}

// POST /api/experiences
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, type, description, startDate, endDate, studentId, competencyIds } = body;

    if (!title || !type || !studentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const experience = await prisma.professionalExperience.create({
      data: {
        title,
        type,
        description: description || "",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        studentId,
        competencyIds: competencyIds || [],
        status: "SUBMITTED", // Default to submitted if created (by student or prof)
      },
    });

    return NextResponse.json(experience);
  } catch (error) {
    console.error("POST experience error:", error);
    return NextResponse.json({ error: "Failed to create experience" }, { status: 500 });
  }
}
