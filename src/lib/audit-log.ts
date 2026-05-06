import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/lib/jwt";

type AuditTarget = {
    targetType?: string;
    targetId?: string;
};

type WriteAuditLogInput = AuditTarget & {
    actor: JWTPayload;
    action: string;
    metadata?: Prisma.InputJsonValue;
    request?: Request;
};

export function getRequestIp(request: Request): string | null {
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwardedFor || request.headers.get("x-real-ip") || null;
}

export async function writeAuditLog({
    actor,
    action,
    targetType,
    targetId,
    metadata,
    request,
}: WriteAuditLogInput) {
    try {
        await prisma.auditLog.create({
            data: {
                actorId: actor.sub,
                actorRole: actor.role,
                action,
                targetType,
                targetId,
                metadata,
                ipAddress: request ? getRequestIp(request) : null,
            },
        });
    } catch (error) {
        console.error("[audit-log] Impossible d'ecrire le journal d'audit:", error);
    }
}
