-- Add optional reference-clip fields to VideoProject so users can paste an
-- Instagram/TikTok/YouTube URL and have its style mined as a script seed.

ALTER TABLE "VideoProject"
  ADD COLUMN IF NOT EXISTS "referenceUrl"      TEXT,
  ADD COLUMN IF NOT EXISTS "referenceData"     JSONB,
  ADD COLUMN IF NOT EXISTS "referenceAnalysis" JSONB;
