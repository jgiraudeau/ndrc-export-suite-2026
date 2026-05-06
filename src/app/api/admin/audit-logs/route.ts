import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
    const auth = await requireAuth(request, ["ADMIN"]);
    if ("status" in auth) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const rawLimit = Number.parseInt(searchParams.get("limit") || "50", 10);
        const limit = Number.isFinite(rawLimit)
            ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
            : 50;
        const action = searchParams.get("action") || undefined;
        const actorId = searchParams.get("actorId") || undefined;

        const logs = await prisma.auditLog.findMany({
            where: {
                ...(action ? { action } : {}),
                ...(actorId ? { actorId } : {}),
            },
            select: {
                id: true,
                actorId: true,
                actorRole: true,
                action: true,
                targetType: true,
                targetId: true,
                metadata: true,
                ipAddress: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return apiSuccess({ logs });
    } catch (error) {
        console.error("[admin/audit-logs][GET]", error);
        return apiError("Impossible de recuperer les logs d'audit", 500);
    }
}
