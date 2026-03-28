import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { apiError, apiSuccess } from "@/lib/api-helpers";

// POST /api/auth/admin/login
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return apiError("Email et mot de passe requis");
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail) {
            console.error("ERREUR CRITIQUE : ADMIN_EMAIL est indéfinie dans Vercel");
            return apiError("Configuration ADMIN_EMAIL manquante", 500);
        }
        if (!adminPassword) {
            console.error("ERREUR CRITIQUE : ADMIN_PASSWORD est indéfinie dans Vercel");
            return apiError("Configuration ADMIN_PASSWORD manquante", 500);
        }

        if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
            return apiError("Identifiants incorrects (Email ne correspond pas)", 401);
        }

        if (password !== adminPassword) {
            return apiError("Identifiants incorrects", 401);
        }

        const token = await signToken({
            sub: "admin",
            role: "ADMIN",
            name: "Administrateur",
        });

        return apiSuccess({ token, name: "Administrateur", role: "ADMIN" });
    } catch (err) {
        console.error("[admin/login]", err);
        return apiError("Erreur serveur", 500);
    }
}
