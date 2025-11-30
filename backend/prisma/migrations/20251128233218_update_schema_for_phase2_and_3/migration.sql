/*
  Warnings:

  - You are about to drop the column `impact_assessment` on the `pain_points` table. All the data in the column will be lost.
  - You are about to drop the column `root_cause` on the `pain_points` table. All the data in the column will be lost.
  - You are about to drop the column `step_id` on the `pain_points` table. All the data in the column will be lost.
  - You are about to drop the column `supporting_evidence` on the `pain_points` table. All the data in the column will be lost.
  - You are about to drop the column `condition` on the `process_connections` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_duration` on the `process_steps` table. All the data in the column will be lost.
  - You are about to drop the column `step_number` on the `process_steps` table. All the data in the column will be lost.
  - You are about to drop the column `step_type` on the `process_steps` table. All the data in the column will be lost.
  - Made the column `description` on table `pain_points` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `order` to the `process_steps` table without a default value. This is not possible if the table is not empty.
  - Made the column `position_x` on table `process_steps` required. This step will fail if there are existing NULL values in that column.
  - Made the column `position_y` on table `process_steps` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "pain_points" DROP CONSTRAINT "pain_points_step_id_fkey";

-- DropIndex
DROP INDEX "pain_points_step_id_idx";

-- AlterTable
ALTER TABLE "pain_points" DROP COLUMN "impact_assessment",
DROP COLUMN "root_cause",
DROP COLUMN "step_id",
DROP COLUMN "supporting_evidence",
ADD COLUMN     "estimated_cost" INTEGER,
ADD COLUMN     "estimated_time" INTEGER,
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "impact" TEXT,
ADD COLUMN     "process_step_id" TEXT,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "process_connections" DROP COLUMN "condition",
ADD COLUMN     "label" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'DEFAULT';

-- AlterTable
ALTER TABLE "process_steps" DROP COLUMN "estimated_duration",
DROP COLUMN "step_number",
DROP COLUMN "step_type",
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'TASK',
ALTER COLUMN "required_systems" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "inputs" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "outputs" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "compliance_requirements" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "position_x" SET NOT NULL,
ALTER COLUMN "position_y" SET NOT NULL;

-- AlterTable
ALTER TABLE "processes" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'AS_IS',
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "pain_points_process_step_id_idx" ON "pain_points"("process_step_id");

-- AddForeignKey
ALTER TABLE "pain_points" ADD CONSTRAINT "pain_points_process_step_id_fkey" FOREIGN KEY ("process_step_id") REFERENCES "process_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
