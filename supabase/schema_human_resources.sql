-- ==============================================================================
-- Schema Migration: Human Resources (Faculty & Registration Staff)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bohadtcvnjpwtfqscawk/sql
-- ==============================================================================

-- 1. Create Faculty Table
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    rank TEXT DEFAULT 'Faculty',
    employment_type TEXT NOT NULL DEFAULT 'Full-Time', -- 'Full-Time', 'Part-Time', 'Visiting'
    assigned_units INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active',             -- 'Active', 'On Leave', 'Sabbatical'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Registration Staff Table
CREATE TABLE IF NOT EXISTS public.registration_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Staff',                -- 'Staff' or 'Faculty'
    department TEXT NOT NULL DEFAULT 'Registrar''s Office',
    assigned_window TEXT,                             -- Legacy window field (optional)
    shift TEXT DEFAULT '08:00 AM - 05:00 PM',         -- Legacy shift field (optional)
    status TEXT DEFAULT 'Active',                     -- Legacy status field (optional)
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_staff ENABLE ROW LEVEL SECURITY;

-- 4. Create Permissive Policies for Web Application Access
DROP POLICY IF EXISTS "Public full access on faculty" ON public.faculty;
CREATE POLICY "Public full access on faculty"
    ON public.faculty
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on registration_staff" ON public.registration_staff;
CREATE POLICY "Public full access on registration_staff"
    ON public.registration_staff
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Seed Initial Faculty Records
INSERT INTO public.faculty (faculty_id, name, email, department, rank, employment_type, assigned_units, status)
VALUES
    ('FAC-2026-101', 'Dr. Roberto Mendoza', 'r.mendoza@faculty.sms.edu', 'College of Computer Studies', 'Professor & Dept Chair', 'Full-Time', 18, 'Active'),
    ('FAC-2026-102', 'Engr. Maria Clara Reyes', 'm.reyes@faculty.sms.edu', 'College of Engineering', 'Associate Professor', 'Full-Time', 21, 'Active'),
    ('FAC-2026-103', 'Prof. Alan Turing Hernandez', 'a.hernandez@faculty.sms.edu', 'College of Computer Studies', 'Assistant Professor', 'Full-Time', 24, 'Active'),
    ('FAC-2026-104', 'Dr. Cristina Garcia', 'c.garcia@faculty.sms.edu', 'College of Business & Accountancy', 'Associate Professor', 'Full-Time', 15, 'Sabbatical'),
    ('FAC-2026-105', 'Atty. Fernando Gomez', 'f.gomez@faculty.sms.edu', 'College of Arts & Sciences', 'Lecturer / Legal Studies', 'Part-Time', 9, 'Active'),
    ('FAC-2026-106', 'Prof. Lilian De Castro', 'l.decastro@faculty.sms.edu', 'College of Education', 'Assistant Professor', 'Part-Time', 12, 'On Leave')
ON CONFLICT (faculty_id) DO NOTHING;

-- 6. Seed Initial Registration Staff Records
INSERT INTO public.registration_staff (staff_id, name, email, phone, role, department)
VALUES
    ('260082001', 'Maria Santos', 'm.santos@registrar.sms.edu', '+63 917 123 4567', 'Staff', 'Registrar''s Office'),
    ('260082002', 'Juan Dela Cruz', 'j.delacruz@registrar.sms.edu', '+63 918 234 5678', 'Staff', 'Admissions & Evaluation'),
    ('260082003', 'Elena Rodriguez', 'e.rodriguez@registrar.sms.edu', '+63 919 345 6789', 'Staff', 'College of Computer Studies'),
    ('260082004', 'Gabriel Ramos', 'g.ramos@registrar.sms.edu', '+63 920 456 7890', 'Faculty', 'College of Engineering'),
    ('260082005', 'Carmela Bautista', 'c.bautista@registrar.sms.edu', '+63 921 567 8901', 'Staff', 'Registrar''s Office'),
    ('260082006', 'Patricia Tan', 'p.tan@registrar.sms.edu', '+63 922 678 9012', 'Staff', 'College of Business & Accountancy')
ON CONFLICT (staff_id) DO NOTHING;

-- 7. Compatibility patch: Make rank nullable on faculty table
ALTER TABLE IF EXISTS public.faculty ALTER COLUMN rank DROP NOT NULL;
ALTER TABLE IF EXISTS public.faculty ALTER COLUMN rank SET DEFAULT 'Faculty';

-- 8. Compatibility patch: Add department column to registration_staff
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registration_staff' AND column_name = 'department'
    ) THEN
        ALTER TABLE public.registration_staff ADD COLUMN department TEXT DEFAULT 'Registrar''s Office';
        
        -- Migrate data from assigned_window if present
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'registration_staff' AND column_name = 'assigned_window'
        ) THEN
            UPDATE public.registration_staff 
            SET department = assigned_window 
            WHERE department IS NULL OR department = 'Registrar''s Office';
        END IF;
    END IF;

    -- Make legacy columns optional so they never block inserts
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registration_staff' AND column_name = 'assigned_window'
    ) THEN
        ALTER TABLE public.registration_staff ALTER COLUMN assigned_window DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registration_staff' AND column_name = 'shift'
    ) THEN
        ALTER TABLE public.registration_staff ALTER COLUMN shift DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registration_staff' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.registration_staff ALTER COLUMN status DROP NOT NULL;
    END IF;
END $$;
