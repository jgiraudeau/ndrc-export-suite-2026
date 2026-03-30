import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

// 1. Définir les routes publiques qui ne nécessitent pas d'auth
const publicRoutes = [
    "/teacher/login",
    "/teacher/register",
    "/student/login",
    "/api/auth/teacher/login",
    "/api/auth/teacher/register",
    "/api/auth/student/login",
];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Autoriser les routes publiques
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Autoriser les fichiers statiques et images
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/public") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Récupérer le token depuis les cookies
    const token = request.cookies.get("ndrc_token")?.value;

    // Protection des routes Professeur
    if (pathname.startsWith("/teacher")) {
        if (!token) {
            return NextResponse.redirect(new URL("/teacher/login", request.url));
        }
        const payload = await verifyToken(token);
        if (!payload || (payload.role !== "TEACHER" && payload.role !== "ADMIN")) {
            return NextResponse.redirect(new URL("/teacher/login", request.url));
        }
    }

    // Protection des routes Étudiant
    if (pathname.startsWith("/student")) {
        if (!token) {
            return NextResponse.redirect(new URL("/student/login", request.url));
        }
        const payload = await verifyToken(token);
        if (!payload || payload.role !== "STUDENT") {
            return NextResponse.redirect(new URL("/student/login", request.url));
        }
    }

    // Protection des routes Administration
    if (pathname.startsWith("/admin")) {
        // Exclure la page de login de la protection
        if (pathname === "/admin/login") {
            return NextResponse.next();
        }

        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
        const payload = await verifyToken(token);
        if (!payload || payload.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    // Protection des routes API (hors auth publique)

    if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
        if (!token) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Session expirée" }, { status: 401 });
        }
    }

    return NextResponse.next();
}

// Configurer le matcher pour optimiser les performances
export const config = {
    matcher: [
        "/admin/:path*",
        "/teacher/:path*",
        "/student/:path*",
        "/api/:path*",
    ],
};
