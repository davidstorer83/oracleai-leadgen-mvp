-- AlterTable
ALTER TABLE "coaches" ADD COLUMN     "shareableId" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "coaches_shareableId_key" ON "coaches"("shareableId");

-- Update existing coaches with shareableId
UPDATE "coaches" SET "shareableId" = gen_random_uuid()::text WHERE "shareableId" IS NULL;
