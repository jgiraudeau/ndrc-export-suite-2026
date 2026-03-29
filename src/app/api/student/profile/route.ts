import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import jwt from "jsonwebtoken";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded.studentId) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id: decoded.studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identifier: true,
        classId: true,
        class: {
          select: {
            code: true,
            name: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Étudiant introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      student: {
        ...student,
        name: `${student.firstName} ${student.lastName}`,
        classCode: student.class?.code || "NDRC"
      }
    });

  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  } finally {
    // Note: In Next.js App Router with long-lived pools, we don't necessarily close it every time.
  }
}
