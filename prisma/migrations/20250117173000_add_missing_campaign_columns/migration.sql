-- Add missing columns to Campaign table
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "dismissedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "pendingCount" INTEGER NOT NULL DEFAULT 0;