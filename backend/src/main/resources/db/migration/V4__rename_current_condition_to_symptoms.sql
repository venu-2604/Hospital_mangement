-- Rename current_condition column to symptoms in visits table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'visits'
        AND column_name = 'current_condition'
    ) THEN
        ALTER TABLE visits RENAME COLUMN current_condition TO symptoms;
    END IF;
END $$; 