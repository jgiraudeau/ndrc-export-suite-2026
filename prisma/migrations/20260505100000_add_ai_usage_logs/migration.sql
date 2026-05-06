-- CreateTable
CREATE TABLE "public"."AiUsageLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "model" TEXT,
    "status" TEXT NOT NULL,
    "promptChars" INTEGER NOT NULL DEFAULT 0,
    "responseChars" INTEGER NOT NULL DEFAULT 0,
    "estimatedTokens" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsageLog_actorId_feature_createdAt_idx" ON "public"."AiUsageLog"("actorId" ASC, "feature" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "AiUsageLog_feature_createdAt_idx" ON "public"."AiUsageLog"("feature" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "AiUsageLog_actorRole_createdAt_idx" ON "public"."AiUsageLog"("actorRole" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "AiUsageLog_status_createdAt_idx" ON "public"."AiUsageLog"("status" ASC, "createdAt" ASC);
