import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
    const auth = await requireAuth(request, ["ADMIN"]);
    if ("status" in auth) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const rawLimit = Number.parseInt(searchParams.get("limit") || "100", 10);
        const limit = Number.isFinite(rawLimit)
            ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
            : 100;
        const feature = searchParams.get("feature") || undefined;
        const actorId = searchParams.get("actorId") || undefined;
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const where = {
            ...(feature ? { feature } : {}),
            ...(actorId ? { actorId } : {}),
        };

        const [logs, usageByFeature] = await Promise.all([
            prisma.aiUsageLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit,
            }),
            prisma.aiUsageLog.groupBy({
                by: ["feature"],
                where: { createdAt: { gte: since }, status: { in: ["success", "error"] } },
                _count: { _all: true },
                _sum: { estimatedTokens: true },
            }),
        ]);

        return apiSuccess({
            logs,
            summary24h: usageByFeature.map((item) => ({
                feature: item.feature,
                calls: item._count._all,
                estimatedTokens: item._sum.estimatedTokens || 0,
            })),
        });
    } catch (error) {
        console.error("[admin/ai-usage][GET]", error);
        return apiError("Impossible de recuperer les usages IA", 500);
    }
}
