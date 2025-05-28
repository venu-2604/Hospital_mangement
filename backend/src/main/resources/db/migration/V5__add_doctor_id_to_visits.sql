-- Add doctor_id column to visits table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'visits' AND column_name = 'doctor_id'
    ) THEN
        ALTER TABLE visits ADD COLUMN doctor_id VARCHAR(50);
        ALTER TABLE visits ADD CONSTRAINT fk_visits_doctor 
            FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id);
    END IF;
END $$; 