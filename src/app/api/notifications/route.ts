import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

// GET /api/notifications — Récupérer les notifications de l'utilisateur
export async function GET(request: NextRequest) {
    const auth = await requireAuth(request, ["STUDENT", "TEACHER"]);
    if ("status" in auth) return auth;

    try {
        const userId = auth.payload.sub;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        return apiSuccess(notifications);
    } catch (err) {
        console.error("[notifications GET]", err);
        return apiError("Erreur serveur", 500);
    }
}

// PATCH /api/notifications — Marquer comme lu
export async function PATCH(request: NextRequest) {
    const auth = await requireAuth(request, ["STUDENT", "TEACHER"]);
    if ("status" in auth) return auth;

    try {
        const { id, all } = await request.json();
        const userId = auth.payload.sub;

        if (all) {
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });
            return apiSuccess({ success: true });
        }

        if (!id) return apiError("ID is required", 400);

        const notification = await prisma.notification.update({
            where: { id, userId },
            data: { isRead: true }
        });

        return apiSuccess(notification);
    } catch (err) {
        console.error("[notifications PATCH]", err);
        return apiError("Erreur serveur", 500);
    }
}
