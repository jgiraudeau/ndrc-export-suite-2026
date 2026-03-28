import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { apiError, apiSuccess } from "@/lib/api-helpers";
import { studentLoginSchema } from "@/lib/validations";

// POST /api/auth/student/login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parseResult = studentLoginSchema.safeParse(body);

        if (!parseResult.success) {
            return apiError("Identifiant ou mot de passe invalide", 400);
        }

        const { identifier, password } = parseResult.data;

        const student = await prisma.student.findUnique({
            where: { identifier: identifier.toLowerCase().trim() },
            include: { class: true },
        });

        if (!student) {
            return apiError("Identifiant ou mot de passe incorrect", 401);
        }

        const valid = await bcrypt.compare(password, student.passwordHash);
        if (!valid) {
            return apiError("Identifiant ou mot de passe incorrect", 401);
        }

        const token = await signToken({
            sub: student.id,
            role: "STUDENT",
            name: `${student.firstName} ${student.lastName}`,
            classCode: student.class.code,
        });

        // Configurer la réponse avec le cookie
        const response = apiSuccess({
            token,
            name: `${student.firstName} ${student.lastName}`,
            role: "STUDENT",
            classCode: student.class.code,
            studentId: student.id,
        });

        response.cookies.set("ndrc_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 jours
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("[student/login]", err);
        return apiError("Erreur serveur", 500);
    }
}
