-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "branding_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "parent_process_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_steps" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "step_type" TEXT NOT NULL,
    "responsible_role" TEXT,
    "department" TEXT,
    "estimated_duration" INTEGER,
    "required_systems" TEXT[],
    "inputs" TEXT[],
    "outputs" TEXT[],
    "compliance_requirements" TEXT[],
    "position_x" DOUBLE PRECISION,
    "position_y" DOUBLE PRECISION,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_connections" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "source_step_id" TEXT NOT NULL,
    "target_step_id" TEXT NOT NULL,
    "condition" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pain_points" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "step_id" TEXT,
    "identified_by_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "impact_assessment" TEXT,
    "root_cause" TEXT,
    "supporting_evidence" TEXT[],
    "is_ai_detected" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pain_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "pain_point_id" TEXT,
    "recommendation_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "implementation_steps" TEXT[],
    "estimated_effort" TEXT,
    "estimated_impact" JSONB,
    "priority_score" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "generated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_processes" (
    "id" TEXT NOT NULL,
    "source_process_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "business_requirements" JSONB,
    "implementation_roadmap" JSONB,
    "impact_analysis" JSONB,
    "created_by_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "target_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "industry_sector" TEXT NOT NULL DEFAULT 'insurance',
    "template_data" JSONB NOT NULL,
    "preview_image_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "export_type" TEXT NOT NULL,
    "file_url" TEXT,
    "file_size_bytes" BIGINT,
    "export_config" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "processes_organization_id_idx" ON "processes"("organization_id");

-- CreateIndex
CREATE INDEX "processes_created_by_id_idx" ON "processes"("created_by_id");

-- CreateIndex
CREATE INDEX "processes_category_idx" ON "processes"("category");

-- CreateIndex
CREATE INDEX "processes_status_idx" ON "processes"("status");

-- CreateIndex
CREATE INDEX "process_steps_process_id_idx" ON "process_steps"("process_id");

-- CreateIndex
CREATE INDEX "process_connections_process_id_idx" ON "process_connections"("process_id");

-- CreateIndex
CREATE INDEX "pain_points_process_id_idx" ON "pain_points"("process_id");

-- CreateIndex
CREATE INDEX "pain_points_step_id_idx" ON "pain_points"("step_id");

-- CreateIndex
CREATE INDEX "recommendations_process_id_idx" ON "recommendations"("process_id");

-- CreateIndex
CREATE INDEX "target_processes_source_process_id_idx" ON "target_processes"("source_process_id");

-- CreateIndex
CREATE INDEX "process_templates_category_idx" ON "process_templates"("category");

-- CreateIndex
CREATE INDEX "process_templates_is_public_idx" ON "process_templates"("is_public");

-- CreateIndex
CREATE INDEX "exports_process_id_idx" ON "exports"("process_id");

-- CreateIndex
CREATE INDEX "exports_user_id_idx" ON "exports"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processes" ADD CONSTRAINT "processes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processes" ADD CONSTRAINT "processes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processes" ADD CONSTRAINT "processes_parent_process_id_fkey" FOREIGN KEY ("parent_process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_steps" ADD CONSTRAINT "process_steps_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_connections" ADD CONSTRAINT "process_connections_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_connections" ADD CONSTRAINT "process_connections_source_step_id_fkey" FOREIGN KEY ("source_step_id") REFERENCES "process_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_connections" ADD CONSTRAINT "process_connections_target_step_id_fkey" FOREIGN KEY ("target_step_id") REFERENCES "process_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pain_points" ADD CONSTRAINT "pain_points_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pain_points" ADD CONSTRAINT "pain_points_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "process_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pain_points" ADD CONSTRAINT "pain_points_identified_by_id_fkey" FOREIGN KEY ("identified_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_pain_point_id_fkey" FOREIGN KEY ("pain_point_id") REFERENCES "pain_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_processes" ADD CONSTRAINT "target_processes_source_process_id_fkey" FOREIGN KEY ("source_process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_processes" ADD CONSTRAINT "target_processes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_templates" ADD CONSTRAINT "process_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
