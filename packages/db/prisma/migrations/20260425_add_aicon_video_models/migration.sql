-- CreateEnum
CREATE TYPE "VideoDuration" AS ENUM ('s15', 's30', 's60');

-- CreateEnum
CREATE TYPE "VideoProjectStatus" AS ENUM ('draft', 'scripted', 'generating', 'reviewing', 'animating', 'assembling', 'done', 'failed');

-- CreateEnum
CREATE TYPE "SceneStatus" AS ENUM ('pending', 'generating', 'done', 'failed');

-- CreateTable
CREATE TABLE "VideoProject" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "duration" "VideoDuration" NOT NULL DEFAULT 's30',
    "status" "VideoProjectStatus" NOT NULL DEFAULT 'draft',
    "script" JSONB,
    "finalVideoUrl" TEXT,
    "costUsd" DECIMAL(10,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VideoProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoScene" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "voiceover" TEXT,
    "durationS" INTEGER NOT NULL,
    "shotType" TEXT,
    "visualDescription" TEXT,
    "imagePrompt" TEXT,
    "negativePrompt" TEXT,
    "imageUrl" TEXT,
    "imageStatus" "SceneStatus" NOT NULL DEFAULT 'pending',
    "videoUrl" TEXT,
    "videoStatus" "SceneStatus" NOT NULL DEFAULT 'pending',
    "veoOperationName" TEXT,
    "veoPollAttempts" INTEGER NOT NULL DEFAULT 0,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VideoScene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoProject_status_idx" ON "VideoProject"("status");
CREATE INDEX "VideoProject_createdAt_idx" ON "VideoProject"("createdAt");
CREATE INDEX "VideoScene_projectId_index_idx" ON "VideoScene"("projectId", "index");
CREATE INDEX "VideoScene_videoStatus_idx" ON "VideoScene"("videoStatus");

-- AddForeignKey
ALTER TABLE "VideoScene" ADD CONSTRAINT "VideoScene_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
