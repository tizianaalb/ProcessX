-- CreateTable
CREATE TABLE "api_configurations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "model_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_configurations_organization_id_idx" ON "api_configurations"("organization_id");

-- CreateIndex
CREATE INDEX "api_configurations_provider_idx" ON "api_configurations"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "api_configurations_organization_id_provider_key" ON "api_configurations"("organization_id", "provider");

-- AddForeignKey
ALTER TABLE "api_configurations" ADD CONSTRAINT "api_configurations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
