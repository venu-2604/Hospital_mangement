-- Check if columns exist and add them if they don't
DO $$
BEGIN
    -- Add patient_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'labtests' AND column_name = 'patient_id'
    ) THEN
        ALTER TABLE labtests 
        ADD COLUMN patient_id VARCHAR(10) REFERENCES patients(patient_id);
    END IF;

    -- Add test_given_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'labtests' AND column_name = 'test_given_at'
    ) THEN
        ALTER TABLE labtests 
        ADD COLUMN test_given_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add result_updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'labtests' AND column_name = 'result_updated_at'
    ) THEN
        ALTER TABLE labtests 
        ADD COLUMN result_updated_at TIMESTAMP;
    END IF;

    -- Update status column default if needed
    ALTER TABLE labtests 
    ALTER COLUMN status SET DEFAULT 'Pending';

END
$$; 