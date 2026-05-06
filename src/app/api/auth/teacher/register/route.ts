import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-helpers";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/auth/teacher/register
// Crée le premier compte formateur (protéger avec une clé admin en prod)
export async function POST(request: NextRequest) {
    const rateLimit = checkRateLimit(request, "auth:teacher-register", 5, 60 * 60 * 1000);
    if (rateLimit) return rateLimit;

    try {
        const { email, password, name } = await request.json();

        if (!email || !password || !name) {
            return apiError("Email, mot de passe et nom requis");
        }

        if (password.length < 8) {
            return apiError("Mot de passe trop court (8 caractères minimum)");
        }

        const existing = await prisma.teacher.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (existing) {
            return apiError("Un compte existe déjà avec cet email", 409);
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await prisma.teacher.create({
            data: {
                email: email.toLowerCase().trim(),
                passwordHash,
                name: name.trim(),
                status: "pending",
            },
        });

        return apiSuccess({
            pending: true,
            message: "Compte créé avec succès. Il sera activé après validation par l'administrateur."
        }, 201);
    } catch (err) {
        console.error("[teacher/register]", err);
        return apiError("Erreur serveur", 500);
    }
}
