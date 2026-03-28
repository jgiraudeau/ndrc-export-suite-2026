import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { apiError, apiSuccess } from "@/lib/api-helpers";
import { teacherLoginSchema } from "@/lib/validations";

// POST /api/auth/teacher/login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parseResult = teacherLoginSchema.safeParse(body);

        if (!parseResult.success) {
            return apiError("Email ou mot de passe invalide", 400);
        }

        const { email, password } = parseResult.data;

        const teacher = await prisma.teacher.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!teacher) {
            return apiError("Identifiants incorrects", 401);
        }

        const valid = await bcrypt.compare(password, teacher.passwordHash);
        if (!valid) {
            return apiError("Identifiants incorrects", 401);
        }

        if (teacher.status === "pending") {
            return apiError("Votre compte est en attente de validation par l'administrateur", 403);
        }

        if (teacher.status === "rejected") {
            return apiError("Votre compte a été refusé par l'administrateur", 403);
        }

        const token = await signToken({
            sub: teacher.id,
            role: "TEACHER",
            name: teacher.name,
        });

        // Configurer la réponse avec le cookie
        const response = apiSuccess({ token, name: teacher.name, role: "TEACHER" });
        response.cookies.set("ndrc_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 jours
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("[teacher/login]", err);
        return apiError("Erreur serveur", 500);
    }
}
