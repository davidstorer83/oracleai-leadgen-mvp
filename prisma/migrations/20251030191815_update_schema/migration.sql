-- AlterTable
ALTER TABLE "training_jobs" ADD COLUMN     "videosProcessed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "videosTotal" INTEGER NOT NULL DEFAULT 0;
