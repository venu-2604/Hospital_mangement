-- Add notes column to visits table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'visits' AND column_name = 'notes'
    ) THEN
        ALTER TABLE visits ADD COLUMN notes TEXT;
    END IF;
END $$; 