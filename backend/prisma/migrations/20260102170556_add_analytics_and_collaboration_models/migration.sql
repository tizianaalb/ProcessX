-- CreateTable
CREATE TABLE "process_health_metrics" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "complexity" INTEGER NOT NULL,
    "bottlenecks" INTEGER NOT NULL,
    "cycle_time" DOUBLE PRECISION,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_reviews" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "reviewer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "decision" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "process_health_metrics_process_id_idx" ON "process_health_metrics"("process_id");

-- CreateIndex
CREATE INDEX "process_health_metrics_created_at_idx" ON "process_health_metrics"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "process_reviews_process_id_idx" ON "process_reviews"("process_id");

-- CreateIndex
CREATE INDEX "process_reviews_reviewer_id_idx" ON "process_reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "process_reviews_status_idx" ON "process_reviews"("status");

-- AddForeignKey
ALTER TABLE "process_health_metrics" ADD CONSTRAINT "process_health_metrics_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_reviews" ADD CONSTRAINT "process_reviews_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_reviews" ADD CONSTRAINT "process_reviews_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_reviews" ADD CONSTRAINT "process_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
