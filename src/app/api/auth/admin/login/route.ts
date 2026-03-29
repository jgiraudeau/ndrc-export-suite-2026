import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { apiError, apiSuccess } from "@/lib/api-helpers";

// Liste des emails autorisés à accéder à l'interface d'administration
const AUTHORIZED_ADMIN_EMAILS = [
    "jacques.giraudeau@gmail.com",
    process.env.ADMIN_EMAIL?.toLowerCase().trim()
].filter(Boolean) as string[];

// POST /api/auth/admin/login
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return apiError("Email et mot de passe requis");
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Vérification si l'email est dans la liste des administrateurs autorisés
        if (!AUTHORIZED_ADMIN_EMAILS.includes(normalizedEmail)) {
            return apiError("Accès réservé aux administrateurs", 401);
        }

        // 2. Recherche de l'utilisateur dans la base de données
        const teacher = await prisma.teacher.findUnique({
            where: { email: normalizedEmail },
        });

        // 3. Authentification
        if (teacher) {
            // Authentification via DB
            const valid = await bcrypt.compare(password, teacher.passwordHash);
            if (!valid) {
                return apiError("Identifiants incorrects", 401);
            }
        } 
        else {
            // Fallback sur variable d'environnement (si pas en DB, ex: déploiement initial)
            const envAdminEmail = process.env.ADMIN_EMAIL;
            const envAdminPassword = process.env.ADMIN_PASSWORD;

            if (envAdminEmail && normalizedEmail === envAdminEmail.toLowerCase().trim()) {
                if (password !== envAdminPassword) {
                    return apiError("Identifiants incorrects", 401);
                }
            } else {
                return apiError("Compte administrateur non configuré", 404);
            }
        }

        // 4. Génération du token avec le rôle ADMIN
        const token = await signToken({
            sub: teacher?.id || "admin_env",
            role: "ADMIN",
            name: teacher?.name || "Administrateur Système",
        });

        const response = apiSuccess({ 
            token, 
            name: teacher?.name || "Administrateur", 
            role: "ADMIN" 
        });

        // Configurer la réponse avec le cookie pour le middleware
        response.cookies.set("ndrc_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 jours
            path: "/",
        });

        return response;


    } catch (err) {
        console.error("[admin/login]", err);
        return apiError("Erreur serveur lors de la connexion admin", 500);
    }
}

