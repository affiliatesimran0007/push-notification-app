-- Add dismissedCount and pendingCount columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Campaign' AND column_name = 'dismissedCount') THEN
        ALTER TABLE "Campaign" ADD COLUMN "dismissedCount" INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Campaign' AND column_name = 'pendingCount') THEN
        ALTER TABLE "Campaign" ADD COLUMN "pendingCount" INTEGER DEFAULT 0;
    END IF;
END $$;