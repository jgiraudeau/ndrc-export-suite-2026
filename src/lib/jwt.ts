import { SignJWT, jwtVerify } from "jose";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in production environment");
}

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-dev-secret-CHANGE-IN-PRODUCTION"
);

export type JWTPayload = {
    sub: string;       // ID de l'utilisateur (teacher ou student)
    role: "TEACHER" | "STUDENT" | "ADMIN";
    name: string;
    classCode?: string; // Pour les élèves uniquement
    exp?: number;
};

/**
 * Crée un JWT signé valable 7 jours
 */
export async function signToken(payload: Omit<JWTPayload, "exp">): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(SECRET);
}

/**
 * Vérifie et décode un JWT
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

/**
 * Extrait le token depuis les cookies (pour le Middleware/SSR) ou les headers (Client/API)
 */
export function extractToken(request: Request): string | null {
    // 1. Tenter depuis les headers (Authorization: Bearer ...)
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }

    // 2. Tenter depuis les cookies (format cookie: ndrc_token=...)
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
        const tokenMatch = cookieHeader.match(/ndrc_token=([^;]+)/);
        if (tokenMatch) return tokenMatch[1];
    }

    return null;
}
