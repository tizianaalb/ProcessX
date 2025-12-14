-- CreateTable
CREATE TABLE "backups" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "backups_filename_key" ON "backups"("filename");

-- CreateIndex
CREATE INDEX "backups_created_by_id_idx" ON "backups"("created_by_id");

-- CreateIndex
CREATE INDEX "backups_created_at_idx" ON "backups"("created_at");

-- AddForeignKey
ALTER TABLE "backups" ADD CONSTRAINT "backups_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
