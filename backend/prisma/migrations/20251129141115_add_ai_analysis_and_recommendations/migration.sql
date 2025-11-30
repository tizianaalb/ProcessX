-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "understanding" JSONB,
    "detectedPainPoints" JSONB,
    "recommendations" JSONB,
    "generatedProcess" JSONB,
    "aiProvider" TEXT NOT NULL,
    "modelId" TEXT,
    "tokens_used" INTEGER,
    "cost" DECIMAL(10,4),
    "error_message" TEXT,
    "initiated_by_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_recommendations" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedBenefits" JSONB NOT NULL,
    "implementation" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "implemented_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_analyses_process_id_idx" ON "ai_analyses"("process_id");

-- CreateIndex
CREATE INDEX "ai_analyses_status_idx" ON "ai_analyses"("status");

-- CreateIndex
CREATE INDEX "process_recommendations_process_id_idx" ON "process_recommendations"("process_id");

-- CreateIndex
CREATE INDEX "process_recommendations_status_idx" ON "process_recommendations"("status");

-- CreateIndex
CREATE INDEX "process_recommendations_priority_idx" ON "process_recommendations"("priority");

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_initiated_by_id_fkey" FOREIGN KEY ("initiated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_recommendations" ADD CONSTRAINT "process_recommendations_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_recommendations" ADD CONSTRAINT "process_recommendations_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "ai_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_recommendations" ADD CONSTRAINT "process_recommendations_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
