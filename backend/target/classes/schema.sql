CREATE SEQUENCE IF NOT EXISTS patient_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS op_no_seq START 1;
CREATE SEQUENCE IF NOT EXISTS reg_no_seq START 1;

CREATE TABLE IF NOT EXISTS patients (
    patient_id VARCHAR(10) PRIMARY KEY DEFAULT LPAD(NEXTVAL('patient_id_seq')::TEXT, 3, '0'),
    photo BYTEA,
    surname VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL,
    father_name VARCHAR(50),
    age INT CHECK (age >= 0),
    blood_group VARCHAR(5),
    gender VARCHAR(10),
    aadhar_number VARCHAR(12) UNIQUE NOT NULL,
    phone_number VARCHAR(15),
    address TEXT,
    total_visits INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS visits (
    visit_id SERIAL PRIMARY KEY,
    patient_id VARCHAR(10) REFERENCES patients(patient_id),
    doctor_id VARCHAR(50) REFERENCES doctor(doctor_id),
    op_no VARCHAR(10),
    reg_no VARCHAR(10),
    bp VARCHAR(10),
    weight VARCHAR(10),
    temperature VARCHAR(10),
    symptoms TEXT,
    complaint TEXT,
    status VARCHAR(10) CHECK (status IN ('Active', 'Critical')),
    prescription TEXT,
    notes TEXT,
    visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS labtests (
    test_id SERIAL PRIMARY KEY,
    visit_id INT REFERENCES visits(visit_id),
    patient_id VARCHAR(10) REFERENCES patients(patient_id),
    test_name VARCHAR(100),
    result VARCHAR(100),
    reference_range VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Pending',
    test_given_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result_updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor (
    doctor_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'DOCTOR',
    status VARCHAR(20),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nurse (
    nurse_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'NURSE',
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Add new columns to doctor table
ALTER TABLE doctor 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'DOCTOR',
ADD COLUMN IF NOT EXISTS status VARCHAR(20),
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Create trigger functions only if they don't exist
DO $$
BEGIN
    -- OP No trigger function
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'format_op_no') THEN
        CREATE FUNCTION format_op_no() RETURNS TRIGGER AS $$
        BEGIN
            NEW.op_no := 'P' || LPAD(NEXTVAL('op_no_seq')::TEXT, 3, '0');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;

    -- REG No trigger function
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'format_reg_no') THEN
        CREATE FUNCTION format_reg_no() RETURNS TRIGGER AS $$
        BEGIN
            NEW.reg_no := 'R' || LPAD(NEXTVAL('reg_no_seq')::TEXT, 3, '0');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;

    -- Total visits update function
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_total_visits') THEN
        CREATE FUNCTION update_total_visits()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE patients
            SET total_visits = total_visits + 1
            WHERE patient_id = NEW.patient_id;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Create triggers if they don't exist
DO $$
BEGIN
    -- OP No trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_format_op_no') THEN
        CREATE TRIGGER trg_format_op_no
        BEFORE INSERT ON visits
        FOR EACH ROW
        EXECUTE FUNCTION format_op_no();
    END IF;

    -- REG No trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_format_reg_no') THEN
        CREATE TRIGGER trg_format_reg_no
        BEFORE INSERT ON visits
        FOR EACH ROW
        EXECUTE FUNCTION format_reg_no();
    END IF;

    -- Total visits trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_total_visits') THEN
        CREATE TRIGGER trg_update_total_visits
        AFTER INSERT ON visits
        FOR EACH ROW
        EXECUTE FUNCTION update_total_visits();
    END IF;
END $$;

-- Add new columns to nurse table
ALTER TABLE nurse 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'NURSE',
ADD COLUMN IF NOT EXISTS status VARCHAR(20); 