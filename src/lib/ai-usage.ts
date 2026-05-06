import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/lib/jwt";
import { getRequestIp } from "@/lib/audit-log";

export type AiFeature =
    | "student.chat"
    | "teacher.generate_course"
    | "teacher.refine_document"
    | "teacher.generate_mission"
    | "teacher.export_quiz"
    | "teacher.evaluate_student"
    | "teacher.transcribe_audio";

type AiUsageStatus = "success" | "error" | "blocked" | "skipped";

type AiUsageInput = {
    actor: JWTPayload;
    feature: AiFeature;
    model?: string;
    status: AiUsageStatus;
    promptChars?: number;
    responseChars?: number;
    errorMessage?: string;
    metadata?: Prisma.InputJsonValue;
    request?: Request;
};

const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000;

const DAILY_QUOTAS: Record<JWTPayload["role"], Partial<Record<AiFeature, number>>> = {
    STUDENT: {
        "student.chat": 40,
        "teacher.generate_mission": 10,
    },
    TEACHER: {
        "teacher.generate_course": 30,
        "teacher.refine_document": 50,
        "teacher.generate_mission": 40,
        "teacher.export_quiz": 30,
        "teacher.evaluate_student": 50,
        "teacher.transcribe_audio": 40,
    },
    ADMIN: {
        "teacher.generate_course": 120,
        "teacher.refine_document": 160,
        "teacher.generate_mission": 120,
        "teacher.export_quiz": 100,
        "teacher.evaluate_student": 120,
        "teacher.transcribe_audio": 100,
    },
};

function estimateTokens(promptChars = 0, responseChars = 0) {
    return Math.ceil((promptChars + responseChars) / 4);
}

export function getAiQuotaLimit(actor: JWTPayload, feature: AiFeature) {
    return DAILY_QUOTAS[actor.role][feature] ?? 20;
}

export async function checkAiQuota(request: Request, actor: JWTPayload, feature: AiFeature) {
    const limit = getAiQuotaLimit(actor, feature);
    const since = new Date(Date.now() - QUOTA_WINDOW_MS);

    const used = await prisma.aiUsageLog.count({
        where: {
            actorId: actor.sub,
            feature,
            createdAt: { gte: since },
            status: { in: ["success", "error"] },
        },
    });

    if (used < limit) return null;

    await logAiUsage({
        actor,
        feature,
        status: "blocked",
        metadata: { limit, used, windowHours: 24 },
        request,
    });

    return NextResponse.json(
        {
            error: `Quota IA atteint pour cette fonctionnalité (${limit} utilisations sur 24h). Réessayez plus tard.`,
            quota: { limit, used, windowHours: 24 },
        },
        {
            status: 429,
            headers: { "Retry-After": String(60 * 60) },
        }
    );
}

export async function logAiUsage({
    actor,
    feature,
    model,
    status,
    promptChars = 0,
    responseChars = 0,
    errorMessage,
    metadata,
    request,
}: AiUsageInput) {
    try {
        await prisma.aiUsageLog.create({
            data: {
                actorId: actor.sub,
                actorRole: actor.role,
                feature,
                model,
                status,
                promptChars,
                responseChars,
                estimatedTokens: estimateTokens(promptChars, responseChars),
                errorMessage: errorMessage ? errorMessage.slice(0, 500) : null,
                metadata,
                ipAddress: request ? getRequestIp(request) : null,
            },
        });
    } catch (error) {
        console.error("[ai-usage] Impossible d'ecrire le journal IA:", error);
    }
}
